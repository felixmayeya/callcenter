/**
*@desc 智能质检方法(根据系统设置的自定义规则正在匹配和阈值进行计算自动质检)
*@param parser_result 语音转换文件解析结果
*@param rulesResult 规则集合
*@param weightsResult 阈值集合
*@param ruleWeight 系统权重对象包括智能权重分值和人工权重分值
*@param keywordsResult 关键字集合
*@author fanxd
*@return 返回audio要更新的结果
*/
function intelligentResult(parser_result,rulesResult,weightsResult,ruleWeight,keywordsResult){
  var log = console.log.bind(console);

  var parserRule = require('../libraries/parser_rule');
  var params = {};

  if(JSON.stringify(parser_result)!="{}"){
    var intelligent = ruleWeight.intelligent;//智能质检权重分值
    var machine_result  = []; //智能质检结果匹配规则

    //自定义规则匹配（座席全文本）
    rulesResult.forEach(function(rule){
      var pattern =parserRule(rule.parser_content);
      if(pattern.test(parser_result.omni_sentence_records)){
        log("匹配自定义规则"+pattern);
        intelligent = intelligent-rule.score;
        machine_result.push({
          rule_name: rule.name,
          rule_content: rule.content,
          rule_score : rule.score
        });
      }
    });
    log("自动质检自定义规则匹配");

    //自动质检部分
    weightsResult.forEach(function(rule){
      if(rule.rule_type==="speed_fast"){
        if(parser_result.agent_speed >= rule.threshold_value){
          log("匹配语速过快");
          intelligent = intelligent-rule.score;
          machine_result.push({
            rule_name: rule.name,
            rule_content: rule.name+" >= "+rule.threshold_value,
            rule_score : rule.score
          });
        }
      }else if(rule.rule_type==="speech_rate_slow"){
        if(parser_result.agent_speed <= rule.threshold_value){
          log("匹配语速过慢");
          intelligent = intelligent-rule.score;
          machine_result.push({
            rule_name: rule.name,
            rule_content: rule.name+" <= "+rule.threshold_value,
            rule_score : rule.score
          });
        }
      }else if(rule.rule_type==="mute_ratio"){
        if(parser_result.mute_ratio >= rule.threshold_value){
          log("匹配静音比");
          intelligent = intelligent-rule.score;
          machine_result.push({
            rule_name: rule.name,
            rule_content: rule.name+" >= "+rule.threshold_value,
            rule_score : rule.score
          });
        }
      }else if(rule.rule_type==="single_mute_duration"){
        if(parser_result.single_mute_duration >= rule.threshold_value){
          log("匹配单次静音时长");
          intelligent = intelligent-rule.score;
          machine_result.push({
            rule_name: rule.name,
            rule_content: rule.name+" >= "+rule.threshold_value,
            rule_score : rule.score
          });
        }
      }
    });
    log("自动质检权重规则匹配");

    //正则匹配出现的关键词
    var keywords = []; //关键词以及出现的时间点
    var wordsResult = parser_result.wordsResult;
    wordsResult.forEach(function(wordResult){
      keywordsResult.forEach(function(keyword){
        var  pattern = new RegExp(""+keyword.content+"");
        if(pattern.test(wordResult.word)){
          keywords.push({
            time : wordResult.start_time,
            word : keyword.content,
            type : keyword.type
          });
        }
      });
    })
    log("正则匹配关键词");

    //  保存解析文件结果
    params = {
      "machine_score":intelligent,                //智能得分
      "machine_result" : machine_result,          //智能得分结果
      "dialog_json" : parser_result.records,                    //分析记录对话
      "dialog_text" : parser_result.sentence_records,           //分析文本全文
      "emotion_json" : parser_result.emotion_json,              //带情绪的对话文本内容
      "omni_emotion_json" : parser_result.omni_emotion_json,     //座席带情绪的对话内容数组
      "customer_emotion_json" : parser_result.customer_emotion_json,//客户带情绪的对话内容数组
      "keywords" : keywords,                                    //关键字、时间点
      "words" : parser_result.words,                            //分词
      "call_duration" : parser_result.durtime,                  //通话时长
      "mute_ratio": parser_result.mute_ratio,                   //静音比
      "customer_speed" : parser_result.customer_speed,          //用户语速
      "agent_speed" : parser_result.agent_speed,                //坐席语速
      "speed" : parser_result.speed,                            //平均语速
      "mute_duration" : parser_result.total_time,               //静音时长
      "radio_path" : parser_result.record_key,                  //音频文件路径
      "customer_mute_time" : parser_result.customer_mute_time,  //客户静音总时长
      "omni_mute_time" : parser_result.omni_mute_time,          //座席静音总时长
      "customer_mute_ratio" : parser_result.customer_mute_ratio,//客户静音比
      "omni_mute_ratio" : parser_result.omni_mute_ratio,        //座席静音比
      // "person_score" : ruleWeight.artificial,                   //人工质检权重分值
      "upload_audio.upload_audio_name" : parser_result.radio_name,  //音频文件名称
      "upload_audio.upload_audio_type": 0,  //录音格式 0:PCM(8K16BIT)、1:GSM6.10、2:视频MOV(单音轨)
      "audio_status.upload_status":1,       //上传状态 0 未上传,1 已上传
      "audio_status.conver_status":1,        //语言转换状态 0 未转换,1 已转换
      "audio_status.auto_inspection_status" : 1  //智能质检状态
    }
    log("返回智能解析结果");
  }



  return params;
}

module.exports = intelligentResult;
