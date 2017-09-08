
/**
*@desc 解析json数据
*@param file xml文件带路径名称
*@param data  json数据
*@author fanxd
*@return 返回解析json数据结果
*/
function parserJsonResult(file,data){
  var log = console.log.bind(console);


  var sentence_list = [];
  var sentence_records = "";//音频所有文本内容
  var omni_sentence_records = "";//座席音频所有文本内容
  var customer_sentence_records = "";//客户音频所有文本内容

  var agent_speed_total = 0;//座席语速总和
  var agent_num = 0 ;//座席说话次数
  var customer_speed_total = 0;//用户语速总和
  var customer_num = 0;//用户说话次数
  var speed_total = 0;//座席用户语速总和
  var speed_num = 0;//说话次数

  var single_mute_duration ="";//单次静音时长

  var record = data.root.ok_list.record;
  var sentences = data.root.ok_list.record.sentence_list.sentence;

  var record_key = data.root.ok_list.record["@record_key"];//音频路径
  //var radio_name = record_key.substring(record_key.lastIndexOf("/")+1,record_key.length);
  var radio_name = record_key.split("/").pop();

  var durtime = data.root.ok_list.record["@durtime"];//音频总时长
  var total_time = data.root.ok_list.record.silence_list["@total_time"];//静音总时长
  var customer_mute_time = 0; //客户静音总时长
  var omni_mute_time = 0 ;//座席静音总时长
  var silences = data.root.ok_list.record.silence_list.silence;//静音时间段列表

  var timeRoleMap = {}; // 以key-value形式存放对话开始时间点和角色
  var emotion_json = [];//带情绪的对话内容数组

  var word_list = [];
  var words = [];//客户分词集合

  //循环对话文本列表
  sentences.forEach(function(sentence){
    var sentence_text = sentence["@text"];
    var start_time = sentence["@start_time"];
    var end_time = sentence["@end_time"];
    var speed = sentence["@speed"];
    var role =  sentence["@role"];
    var emotion_type =  sentence["@emotion_type"];
    var emotion_score =  sentence["@emotion-score"];

    if(role==="1"){
      agent_speed_total += Number(speed);
      agent_num ++;
      omni_sentence_records += sentence_text+";";
    }else{
      customer_speed_total += Number(speed);
      customer_num++;
      customer_sentence_records += sentence_text+";";
    }
    speed_total += Number(speed);
    speed_num ++;
    timeRoleMap[start_time] = role;
    sentence_records += sentence_text+";";

    word_list = word_list.concat(sentence.word_list.word);

    var dialog_json= {
      start_time: start_time,
      end_time: end_time,
      speed: speed,
      role: role,
      emotion_type: emotion_type,
      emotion_score: emotion_score,
      sentence_text: sentence_text
    };
    //带情绪的文本内容
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
      var role2_word_list = sentence.word_list.word;
      for(var j=0; j < role2_word_list.length; j++){
        words.push(role2_word_list[j]["@text"]);
      }
    }

  })

  silences.forEach(function(silence){
    var start_time = silence["@start_time"];
    var end_time = silence["@end_time"];
    var diff = end_time - start_time;
    if(single_mute_duration < diff){
      single_mute_duration = diff
    }
    if(timeRoleMap[end_time]==="2"){
      customer_mute_time += diff; //客户静音总时长
    }else{
      omni_mute_time += diff; //座席静音总时长
    }
  })


  var wordsResult = [];
  for(var i=0;i<word_list.length;i++){
    var word = word_list[i]["@text"];
    var start_time = word_list[i]["@start_time"];
    var end_time = word_list[i]["@end_time"];
    wordsResult.push({
      word : word,
      start_time : start_time,
      end_time : end_time
    });
  }
  log("解析语音文本文件");

  //计算座席平均语速、用户平均语速、静音比等
  var speed =  (speed_total/speed_num).toFixed(2);//平均语速
  var agent_speed = (agent_speed_total/speed_num).toFixed(2); //座席平均语速
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

  var parser_result = {
    durtime : durtime,          //语音时长
    mute_ratio : mute_ratio,        //静音比
    customer_mute_time : customer_mute_time,//客户静音总时长
    omni_mute_time : omni_mute_time,//座席静音总时长
    customer_mute_ratio : customer_mute_ratio, //客户静音比
    omni_mute_ratio : omni_mute_ratio,//座席静音比
    wordsResult : wordsResult,  //转换分词集合
    words : words,              //分词
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
    emotion_json : emotion_json, //带情绪的对话文本内容数组
    omni_emotion_json :omni_emotion_json, //座席带情绪的对话内容数组
    customer_emotion_json : customer_emotion_json, //客户带情绪的对话内容数组
    radio_name : radio_name         //音频文件名称
  }
  return parser_result;
}

module.exports = parserJsonResult;
