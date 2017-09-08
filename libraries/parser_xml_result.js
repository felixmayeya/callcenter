/**
*@desc 解析语音转换xml文件
*@param file xml文件名称（带路径）
*@param data  xml文本文件流 fs.readFile(file,'utf-8',function(err,data)
*@author fanxd
*@return 返回xml解析结果
*/
function parserXmlResult(file,data){
  var log = console.log.bind(console);
  var parser_result ={};//返回解析结果

  var select = require('xpath.js') , dom = require('xmldom').DOMParser

  var sentence_list = [];
  var sentence_records = "";//音频所有文本内容
  var omni_sentence_records = "";//座席音频所有文本内容
  var customer_sentence_records = "";//客户音频所有文本内容

  var agent_speed_total = 0;//座席语速总和
  var agent_num = 0;//座席说话次数
  var customer_speed_total = 0;//用户语速总和
  var customer_num = 0;//用户说话次数
  var speed_total = 0;//座席用户语速总和
  var speed_num = 0;//说话次数

  var single_mute_duration =0;//单次静音时长

  var doc = new dom().parseFromString(data);
  var record = select(doc, "//root//ok_list//record");
  var silence_list = select(doc, "//root//ok_list//silence_list");
  var sentence = select(doc, "//root//ok_list//sentence");
  var word_list = select(doc, "//root//ok_list//word");

  var record_key = record[0].getAttribute("record_key");//音频路径
  var radio_name = record_key.substring(record_key.lastIndexOf("/")+1,record_key.length);
  //var radio_name = record_key.split("/").pop();
  var durtime = record[0].getAttribute("durtime");//音频总时长
  var total_time = silence_list[0].getAttribute("total_time");//静音总时长
  var customer_mute_time = 0; //客户静音总时长
  var omni_mute_time = 0 ;//座席静音总时长
  var silences = select(doc, "//root//ok_list//silence");//静音时间段列表
  var timeRoleMap = {}; // 以key-value形式存放对话开始时间点和角色
  var emotion_json = [];//带情绪的对话内容数组
  var customer_emotion_json = []; //客户带情绪的对话内容数组
  var omni_emotion_json = [] ;//座席带情绪的对话内容数组
  var words = []; //客户分词集合

  if(durtime>0 && sentence.length>0){
    //循环对话文本列表
    for(var i=0; i < sentence.length; i++){
      var sentence_text = sentence[i].getAttribute("text");
      var start_time = sentence[i].getAttribute("start_time");
      var end_time = sentence[i].getAttribute("end_time");
      var speed = sentence[i].getAttribute("speed");
      var role =  sentence[i].getAttribute("role");
      var emotion_type =  sentence[i].getAttribute("emotion_type");
      var emotion_score =  sentence[i].getAttribute("emotion-score");

      if(role==="1"){
        agent_speed_total += Number(speed);
        agent_num ++;
        omni_sentence_records += sentence_text+";";//座席文本全文
      }else{
        customer_speed_total += Number(speed);
        customer_num++;
        customer_sentence_records += sentence_text+";";//客户文本全文
      }
      speed_total += Number(speed);
      speed_num ++;
      timeRoleMap[start_time] = role;
      sentence_records += sentence_text+";";
      //正则表达式匹配
      var dialog_json= {
        start_time : start_time,
        end_time : end_time,
        speed : speed,
        role : role,
        emotion_type : emotion_type,
        emotion_score : emotion_score,
        sentence_text : sentence_text
      };

      sentence_list.push(dialog_json);
      //带情绪的文本内容
      if(emotion_type != ''){
        emotion_json.push(dialog_json);
        if(role === "1"){
          omni_emotion_json.push(dialog_json);
        }else{
          customer_emotion_json.push(dialog_json);
        }
      }

      //客户文本分词
      if(role === "2"){
        var role2_word_list = select(sentence[i],"//word_list")[i];
        var role2_word_doc = new dom().parseFromString(role2_word_list.toString());
        var role2words = select(role2_word_doc,"//word");
        for(var j=0; j < role2words.length; j++){
          words.push(role2words[j].getAttribute("text"));
        }
      }

    }

    for(var i=0;i<silences.length; i++){
      var start_time = silences[i].getAttribute("start_time");
      var end_time = silences[i].getAttribute("end_time");
      var diff = end_time - start_time;
      if(single_mute_duration < diff){
        single_mute_duration = diff
      }
      if(timeRoleMap[end_time]==="2"){
        customer_mute_time += diff; //客户静音总时长
      }else{
        omni_mute_time += diff; //座席静音总时长
      }
    }
    log("解析静音结果");

    var wordsResult = [];
    for(var i=0;i<word_list.length;i++){
      var word = word_list[i].getAttribute("text");
      var start_time = word_list[i].getAttribute("start_time");
      var end_time = word_list[i].getAttribute("end_time");
      wordsResult.push({
        word : word,
        start_time : start_time,
        end_time : end_time
      });
    }
    log("解析语音文本文件");

    //计算座席平均语速、用户平均语速、静音比等
    var speed =  (speed_total/speed_num).toFixed(2);//平均语速
    var agent_speed = (agent_speed_total/agent_num).toFixed(2); //座席平均语速
    var customer_speed = (customer_speed_total/customer_num).toFixed(2);//用户平均语速
    var mute_ratio = (total_time/durtime).toFixed(2);     //静音比
    var customer_mute_ratio = (customer_mute_time/durtime).toFixed(2);     //客户静音比
    var omni_mute_ratio = (omni_mute_time/durtime).toFixed(2);     //座席静音比

    log("计算座席平均语速、用户平均语速、静音比等");

    //  records：解析相关节点内容，并以json格式返回；
    // sentence_records：得到一整段录音string格式的返回结果(只有对话文本内容)；
    records = {
      record_path: file,
      durtime: durtime,
      silence_total_time : total_time,
      sentence:sentence_list
    }

    parser_result = {
      durtime : durtime,          //语音时长
      mute_ratio : mute_ratio,        //静音比
      customer_mute_time : customer_mute_time,//客户静音总时长
      omni_mute_time : omni_mute_time,//座席静音总时长
      customer_mute_ratio : customer_mute_ratio, //客户静音比
      omni_mute_ratio : omni_mute_ratio,//座席静音比
      wordsResult : wordsResult,  //转换分词集合
      words : words,              //客户分词集合
      total_time : total_time,    //静音时长
      record_key : record_key,    //语音路径
      speed : speed,              //平均语速
      agent_speed : agent_speed,  //座席平均语速
      customer_speed : customer_speed,//客户平均语速
      single_mute_duration : single_mute_duration, //单次静音时长
      records : records,              //分析记录对话
      sentence_records : sentence_records, //分析文本全文
      omni_sentence_records : omni_sentence_records, //座席文本全文
      customer_sentence_records : customer_sentence_records,//客户文本全文
      emotion_json : emotion_json, //带情绪的对话内容数组
      omni_emotion_json :omni_emotion_json, //座席带情绪的对话内容数组
      customer_emotion_json : customer_emotion_json, //客户带情绪的对话内容数组
      radio_name : radio_name         //音频文件名称
    }

  }

  return parser_result;
}

module.exports = parserXmlResult;
