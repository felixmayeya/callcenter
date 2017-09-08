module.exports = function($) {

  /**
  *@desc 自动监控导入csv文件话单数据
  *@author fanxd
  */
  $.get("/import/csv/audio", function*(next){

    var self = this;
    var status =200;
    var results = [];
    var params = this.request.query;
    var file =  params.file;
    //var audioModel=this.model("audioTest");
    var audioModel=this.model("audio");
    var importCallstat = self.library("import_callstat");
    var paramss =  importCallstat.importCallStat(file);
    if(!paramss){
      console.log("no search file or directory");
      results.push("no search file or directory");
      this.status = status;
      this.body = results;
      return;
    }

    yield function(callback){
      paramss.forEach(function(params){
        var result = {};
        audioModel.findOneAndUpdateRow({seq : params.seq},params, function(err, row) {
          if(!err && row){
            result = row;
          }else{
            status = 400;
            console.log(err)
          }
          results.push(result);
          callback();
        });
      });
    }

    var noticeModel=this.model("notice");
    yield function(callback){
      noticeModel.createRow({content : "您的话单数据已上传成功，可以上传音频文件"}, function(err, row) {
        if(err){
          status = 400;
          console.log(err)
        }
        callback();
      });
    }

    console.log("程序执行完毕");
    this.status = status;
    this.body = results;
  });


  /**
  *@desc 自动质检请求
  *@param 带路径的文件名称
  *@author fanxd
  */
  $.get("/import/audio/result", function*(next){

    var self = this;

    var audioModel = this.model("audio");
    var ruleScoreModel = this.model('rule_score');
    var ruleModel = this.model('rule');
    var ruleWeight = this.model("rule_weight");
    var ruleThreshold = this.model("rule_threshold");
    var ruleKeyword = this.model("rule_keyword");
    var noticeModel=this.model("notice");

    var status =200;
    var result = [];
    var log = console.log.bind(console);

    //根据系统查询智能质检权重
    var ruleWeight;
    yield function(callback){
      ruleWeight.getColumnRow({system : "59562e0b3081e182a8097f8f"},{intelligent:1,artificial:1},function(err,row){
        if(!err && row){
          ruleWeight = row;
        }
        callback();
      })
    }
    log("根据系统查询智能质检权重分值"+ruleWeight.intelligent+"...\n");


    //根据系统查询规则评分
    var ruleScores = [];
    yield function(callback){
      ruleScoreModel.getColumnRows({system : "59562e0b3081e182a8097f8f",rule_base : "智能质检评分规则库"},{score:1,user:1,rule:1,rule_type:1},function(err,rows){
        if(!err && rows){
          ruleScores = rows;
        }
        callback();
      })
    }
    log("根据系统查询所有规则评分...\n");

    //根据规则评分中的规则id循环查询规则内容
    var rulesResult = [];
    yield function(callback){
      ruleScores.forEach(function(ruleScore){
        var params = {
          _id : ruleScore.rule,
          status : 1
        }
        if(ruleScore.rule_type==="rule"){
          ruleModel.getColumnRow(params,{parser_content:1,content:1,name:1}, function(err, row) {
            if (!err && row) {
              var rule = {
                score : ruleScore.score,
                user : ruleScore.user,
                rule_type : ruleScore.rule_type,
                parser_content : row.parser_content,
                content : row.content,
                name : row.name
              };
              rulesResult.push(rule);
            }
            callback();
          });
        }
      });
    }
    log("根据规则评分查询所有规则内容...\n");

    //根据规则评分中的阈值id循环查询阈值内容
    var weightsResult = [];
    yield function(callback){
      ruleScores.forEach(function(ruleScore){
        var params = {
          _id : ruleScore.rule,
          status : 1
        }
        if(ruleScore.rule_type!=="rule"){
          ruleThreshold.getColumnRow(params,{value:1,name:1}, function(err, row) {
            if (!err && row) {
              var rule = {
                score : ruleScore.score,
                user : ruleScore.user,
                rule_type : ruleScore.rule_type,
                threshold_value : row.value,
                name : row.name
              };
              weightsResult.push(rule);
            }
            callback();
          });
        }
      });
    }
    log("根据规则评分查询阈值内容...\n");

    //console.log(ruleScoresResult);

    //查询关键词
    var keywordsResult = {};
    yield function(callback){
      ruleKeyword.getColumnRows({status:1},{content:1,type:1},function(err,rows){
        if(!err && rows){
          keywordsResult = rows;
        }
        callback();
      });
    }
    log("查询所有关键字内容...\n");

    var fs=require('fs');
    var params = this.request.query;
    var file =  params.file;
    fs.readFile(file,'utf-8',function(err,data){

      if(!err && data){
        log("读取"+file+"文件...\n");
        log("智能质检开始...\n");
        var parserXmlResult = require('../libraries/parser_xml_result');
        var parser_result = parserXmlResult(file,data);
        var intelligentResult = require('../libraries/intelligent_result');
        var params =  intelligentResult(parser_result,rulesResult,weightsResult,ruleWeight,keywordsResult);
        log("智能质检结束...\n");
        if(JSON.stringify(params)!="{}"){
          var radio_name = params["upload_audio.upload_audio_name"];
          //将相任务和质检员信息更新到对应的db
          audioModel.findOneAndUpdateRow({"upload_audio.upload_audio_name":radio_name}, params, function(err, row) {
            if (err) {
              status = 400;
              console.log(err);
            }
          });
          log("更新智能质检结果...\n");
          //发送通知
          noticeModel.createRow({content : "您的上传的音频文件\""+radio_name+"\"已自动质检，您可以进行人工质检"}, function(err, row) {
            if(err){
              status = 400;
              console.log(err)
            }
          });
          log("发送通知...\n");
        }


      } else{
        console.error(err);
      }

    });

    this.status = status;
    this.body = result;
  })


  /**
  *@desc 导入csv文件话单数据请求
  *@author fanxd
  */
  $.get("/api/import/csv/audio", function*(next){

    var self = this;
    var status =200;
    var results = [];

    //var audioModel=this.model("audioTest");
    var audioModel=this.model("audio");
    var importCallStat = require('../libraries/import_callstat');
    var fs = require("fs");

    var directory = fs.readdirSync(config.get("upload_csv_path"));

    yield function(callback){
      directory.forEach(function(file){
        var paramss =importCallStat(config.get("upload_csv_path")+file);
        if(!paramss){
          console.log("no search file or directory");
          results.push("no search file or directory");
          this.status = status;
          this.body = results;
          return;
        }

        paramss.forEach(function(params){
          var result = {};
          audioModel.findOneAndUpdateRow({seq : params.seq},params, function(err, row) {
            if(!err && row){
              result = row;
            }else{
              status = 400;
              console.log(err)
            }
            results.push(result);
            callback();
          });
        });
      });
    }

    var noticeModel=this.model("notice");
    yield function(callback){
      noticeModel.createRow({content : "您的话单数据已上传成功，可以上传音频文件"}, function(err, row) {
        if(err){
          status = 400;
          console.log(err)
        }
        callback();
      });
    }

    console.log("程序执行完毕");
    this.status = status;
    this.body = results;
  });


  /**
  *@desc 自动质检请求api
  *@author fanxd
  */
  $.get("/api/import/audio/result", function*(next){

    var self = this;
    var audioModel = this.model("audio");
    var ruleScoreModel = this.model('rule_score');
    var ruleModel = this.model('rule');
    var ruleWeight = this.model("rule_weight");
    var ruleThreshold = this.model("rule_threshold");
    var ruleKeyword = this.model("rule_keyword");
    var noticeModel=this.model("notice");

    var status =200;
    var log = console.log.bind(console);


    //根据系统查询智能质检权重
    var ruleWeight;
    yield function(callback){
      ruleWeight.getColumnRow({system : "59562e0b3081e182a8097f8f"},{intelligent:1,artificial:1},function(err,row){
        if(!err && row){
          ruleWeight = row;
        }
        callback();
      })
    }
    log("根据系统查询智能质检权重分值"+ruleWeight.intelligent+"...\n");

    //根据系统查询规则评分
    var ruleScores = [];
    yield function(callback){
      ruleScoreModel.getColumnRows({system : "59562e0b3081e182a8097f8f",rule_base : "智能质检评分规则库"},{score:1,user:1,rule:1,rule_type:1},function(err,rows){
        if(!err && rows){
          ruleScores = rows;
        }
        callback();
      })
    }
    log("根据系统查询所有规则评分...\n");

    //根据规则评分中的规则id循环查询规则内容
    var rulesResult = [];
    yield function(callback){
      ruleScores.forEach(function(ruleScore){
        var params = {
          _id : ruleScore.rule,
          status : 1
        }
        if(ruleScore.rule_type==="rule"){
          ruleModel.getColumnRow(params,{parser_content:1,content:1,name:1}, function(err, row) {
            if (!err && row) {
              var rule = {
                score : ruleScore.score,
                user : ruleScore.user,
                rule_type : ruleScore.rule_type,
                parser_content : row.parser_content,
                content : row.content,
                name : row.name
              };
              rulesResult.push(rule);
            }
            callback();
          });
        }
      });
    }
    log("根据规则评分查询所有规则内容...\n");

    //根据规则评分中的阈值id循环查询阈值内容
    var weightsResult = [];
    yield function(callback){
      ruleScores.forEach(function(ruleScore){
        var params = {
          _id : ruleScore.rule,
          status : 1
        }
        if(ruleScore.rule_type!=="rule"){
          ruleThreshold.getColumnRow(params,{value:1,name:1}, function(err, row) {
            if (!err && row) {
              var rule = {
                score : ruleScore.score,
                user : ruleScore.user,
                rule_type : ruleScore.rule_type,
                threshold_value : row.value,
                name : row.name
              };
              weightsResult.push(rule);
            }
            callback();
          });
        }
      });
    }
    log("根据规则评分查询阈值内容...\n");

    //查询关键词
    var keywordsResult = {};
    yield function(callback){
      ruleKeyword.getColumnRows({status:1},{content:1,type:1},function(err,rows){
        if(!err && rows){
          keywordsResult = rows;
        }
        callback();
      });
    }
    log("查询所有关键字内容...\n");

    //读取转换解析后的xml文件开始
    var explorer_results =  explorer(config.get("conver_xml_path"),keywordsResult,rulesResult,weightsResult,ruleWeight);

    //更新质检结果
    log("更新智能质检结果...\n");
    var result = {
      code:"20000",
      msg :"智能质检成功结束"
    };
    yield function(callback){
      explorer_results.forEach(function(explorer_result){
        var radio_name = explorer_result.radio_name;
        var params = explorer_result.params;
        audioModel.findOneAndUpdateRow({"upload_audio.upload_audio_name":radio_name}, params, function(err, row) {
          if (err) {
            status=400;
            result = {
              code:"20001",
              msg :"智能质检更新失败"
            };
            log(err);
          }
          callback();
        });
      });
    }

    //发送消息通知
    log("发送通知...\n");
    yield function(callback){
      explorer_results.forEach(function(explorer_result){
        var radio_name = explorer_result.radio_name;
        noticeModel.createRow({content : "您的上传的音频文件\""+radio_name+"\"已自动质检，您可以进行人工质检"}, function(err, row) {
          if(err){
            status=400;
            result = {
              code:"20001",
              msg :"智能质检发送通知失败"
            };
            log(err);
          }
          callback();
        });
      });
    }

    this.status = status;
    this.body = result;
  })



  /**
  *@desc 自动循环质检音频文件结果xml文件
  *@param path 转换音频文件结果xml目录
  *@param keywordsResult 系统设定关键字
  *@param ruleScoresResult 自定义规则以及阈值设定
  *@author fanxd
  */
  function explorer(path,keywordsResult,rulesResult,weightsResult,ruleWeight){
    var result = [];
    var log = console.log.bind(console);
    var fs = require("fs");
    log("读取语音文件结果目录开始...\n");
    var files = fs.readdirSync(path);
    //循环文件开始
    log("循环转换语音结果xml文件开始...\n");
    files.forEach(function(file){
      var param_result = {};
      var radio_result_xml =  path + file;
      var explorer_result = [];
      //判断文件存在并且是一个目录
      if(fs.existsSync(radio_result_xml) && fs.statSync(radio_result_xml).isDirectory()){
        log("文件存在并且是一个目录,递归读取目录");
        explorer_result = explorer(radio_result_xml,keywordsResult,rulesResult,weightsResult,ruleWeight);
      }else{
        // 读出所有的文件
        log("读取"+radio_result_xml+"文件...\n");
        var data = fs.readFileSync(radio_result_xml,"utf-8");
        log("智能质检开始...\n");
        var parserXmlResult = require('../libraries/parser_xml_result');
        var parser_result = parserXmlResult(radio_result_xml,data);
        var intelligentResult = require('../libraries/intelligent_result');
        var params =  intelligentResult(parser_result,rulesResult,weightsResult,ruleWeight,keywordsResult);
        if(JSON.stringify(params)!="{}"){
          var radio_name = params["upload_audio.upload_audio_name"];
          param_result.radio_name = radio_name;
          param_result.params = params;
          log("智能质检结束...\n");
          result.push(param_result);
        }
      }
      result = result.concat(explorer_result);
    });
    return result;
  }




  /**
  *@desc xml文件转换json测试示例
  *@author fanxd
  *@return 返回xml文件的json格式数据
  */
  $.post("/api/import/jsons",function*(next){
    console.log("请求");
    var datas = this.request.fields;
console.log(datas);
    var fs = require('fs');
    var fastXmlParser = require("fast-xml-parser");
    //  var xmlData = fs.readFileSync("/home/xml_result/10008_13651766559_103609.xml","utf-8");
     var xmlData = fs.readFileSync("/home/xml_result/10008_13651766559_094322.xml","utf-8");
      //var xmlData = fs.readFileSync("/home/xml_result/10008_13651766559_093532.xml","utf-8");
    //   var xmlData = fs.readFileSync("/home/xml_result/test.xml","utf-8");
    // jsonObj = fastXmlParser.convertToJson(jsonObj);
    var options = {
      ignoreTextNodeAttr: false,
      ignoreNonTextNodeAttr: false,
      attrPrefix: "@",
      textNodeName: "#_text",
      ignoreNameSpace: true,
    };
    var jsonObj = fastXmlParser.parse(xmlData,options);
    console.log(JSON.stringify(jsonObj));

    this.status = 200;
    this.body = jsonObj;
  });




  /**
  *@desc 接收JSON形式的数据（数组，一条或多条数据），并对接收到的数据进行智能评分
  *@param 话单数据的基本信息和xml_result结果的xml数据
  *@author fanxd
  */
  $.post("/api/import/data", function*(next){

    var self = this;

    var status =200;
    var log = console.log.bind(console);
    var datas = this.request.fields;
    for(var i = 0 ; i<datas.length ; i++){
      var data = datas[i];
      var system = data.audio.system; //"59562e0b3081e182a8097f8f"

      var audioModel = this.model("audio");
      var ruleScoreModel = this.model('rule_score');
      var ruleModel = this.model('rule');
      var ruleWeight = this.model("rule_weight");
      var ruleThreshold = this.model("rule_threshold");
      var ruleKeyword = this.model("rule_keyword");
      var noticeModel=this.model("notice");

      //根据系统查询智能质检权重
      var ruleWeight;
      yield function(callback){
        ruleWeight.getColumnRow({system : system},{intelligent:1,artificial:1},function(err,row){
          if(!err && row){
            ruleWeight = row;
          }
          callback();
        })
      }
      log("根据系统查询智能质检权重分值"+ruleWeight.intelligent+"...\n");

      //根据系统查询规则评分
      var ruleScores = [];
      yield function(callback){
        ruleScoreModel.getColumnRows({system : "59562e0b3081e182a8097f8f",rule_base : "智能质检评分规则库"},{score:1,user:1,rule:1,rule_type:1},function(err,rows){
          if(!err && rows){
            ruleScores = rows;
          }
          callback();
        })
      }
      log("根据系统查询所有规则评分...\n");

      //根据规则评分中的规则id循环查询规则内容
      var rulesResult = [];
      yield function(callback){
        ruleScores.forEach(function(ruleScore){
          var params = {
            _id : ruleScore.rule,
            status : 1
          }
          if(ruleScore.rule_type==="rule"){
            ruleModel.getColumnRow(params,{parser_content:1,content:1,name:1}, function(err, row) {
              if (!err && row) {
                var rule = {
                  score : ruleScore.score,
                  user : ruleScore.user,
                  rule_type : ruleScore.rule_type,
                  parser_content : row.parser_content,
                  content : row.content,
                  name : row.name
                };
                rulesResult.push(rule);
              }
              callback();
            });
          }
        });
      }
      log("根据规则评分查询所有规则内容...\n");

      //根据规则评分中的阈值id循环查询阈值内容
      var weightsResult = [];
      yield function(callback){
        ruleScores.forEach(function(ruleScore){
          var params = {
            _id : ruleScore.rule,
            status : 1
          }
          if(ruleScore.rule_type!=="rule"){
            ruleThreshold.getColumnRow(params,{value:1,name:1}, function(err, row) {
              if (!err && row) {
                var rule = {
                  score : ruleScore.score,
                  user : ruleScore.user,
                  rule_type : ruleScore.rule_type,
                  threshold_value : row.value,
                  name : row.name
                };
                weightsResult.push(rule);
              }
              callback();
            });
          }
        });
      }
      log("根据规则评分查询阈值内容...\n");

      //查询关键词
      var keywordsResult = {};
      yield function(callback){
        ruleKeyword.getColumnRows({status:1},{content:1,type:1},function(err,rows){
          if(!err && rows){
            keywordsResult = rows;
          }
          callback();
        });
      }
      log("查询所有关键字内容...\n");


      var parserJsonResult = require('../libraries/parser_json_result');
      var parser_result = parserJsonResult(data.audio.xml_path,data.result);
      var intelligentResult = require('../libraries/intelligent_result');
      var params =  intelligentResult(parser_result,rulesResult,weightsResult,ruleWeight,keywordsResult);
      if(JSON.stringify(params)!="{}"){
        params["seq"] = data.audio.seq;
        params["sit_number"] = data.audio.sit_number;
        params["customer.mobile"] = data.audio.mobile;
        params["call_time"] = data.audio.call_time;
        params["system"] = data.audio.system;
        params["end_comment"] = data.audio.end_comment;
        params["satisfy_comment"] = data.audio.satisfy_comment;
        params["customer.name"] = data.audio.customer;
        params["radio_path"] = data.audio.radio_path;
        params["upload_audio.upload_audio_size"] = data.audio.radio_size;

        //更新质检结果
        log("更新智能质检结果...\n");
        var result = {
          code:"20000",
          msg :"智能质检成功结束"
        };
        var radio_name = params["upload_audio.upload_audio_name"];

        yield function(callback){
          audioModel.findOneAndUpdateRow({"upload_audio.upload_audio_name":radio_name}, params, function(err, row) {
            if (err) {
              status=400;
              result = {
                code:"20001",
                msg :"智能质检更新失败"
              };
              log(err);
            }
            callback();
          });
        }

        //发送消息通知
        log("发送通知...\n");
        yield function(callback){
          noticeModel.createRow({content : "您的上传的音频文件\""+radio_name+"\"已自动质检，您可以进行人工质检"}, function(err, row) {
            if(err){
              status=400;
              result = {
                code:"20001",
                msg :"智能质检发送通知失败"
              };
              log(err);
            }
            callback();
          });
        }
      }


    }

    this.status = status;
    this.body = result;
  })



  /**
  *@desc 接收JSON形式的数据（数组，一条或多条数据）
  *@param 话单数据的基本信息
  *@author fanxd
  */
  $.post("/api/import/audios", function*(next){

    var self = this;

    var status =200;
    var log = console.log.bind(console);
    var datas = this.request.fields;

    for(var i = 0 ; i<datas.length ; i++){
      var data = datas[i];
      var system = data.system; //"59562e0b3081e182a8097f8f"

      var audioModel = this.model("audio");

      params["seq"] = data.seq;
      params["sit_number"] = data.sit_number;
      params["customer.mobile"] = data.mobile;
      params["call_time"] = data.call_time;
      params["system"] = data.system;
      params["end_comment"] = data.end_comment;
      params["satisfy_comment"] = data.satisfy_comment;
      params["customer.name"] = data.customer;
      params["radio_path"] = data.radio_path;
      params["upload_audio.upload_audio_size"] = data.radio_size;
      params["end_comment"] = data.end_comment;
      params["satisfy_comment"] = data.satisfy_comment;
      var radio_name = data.radio_path.split("/").pop();
      params["upload_audio.upload_audio_name"] = radio_name;
      var result = {
        code:"20000",
        msg :"成功"
      };
      yield function(callback){
        audioModel.findOneAndUpdateRow({"upload_audio.upload_audio_name":radio_name}, params, function(err, row) {
          if (err) {
            status=400;
            result = {
              code:"20001",
              msg :"记录更新失败"
            };
            log(err);
          }
          callback();
        });
      }

    }

    this.status = status;
    this.body = result;
  });


  /**
  *@desc 主动请求对方的接口
  *@param 话单数据的基本信息
  *@author fanxd
  */
  $.post("/import/audios", function*(next){

    var self = this;

    var status =200;
    var log = console.log.bind(console);

    var importConfig = {};
    var importConfigsModel = this.model("import_configs");
    yield function(callback){
      importConfigsModel.getRow({import_type:"3"},function(err,row){
        if(!err && row){
          importConfig = row;
        }
        callback();
      });
    }

    var url = importConfig.interface_name;
    var data = importConfig.interface_input;
    var items = importConfig.items;
    var datas  = {};
    var request = require('request');
    request({
      url: url,
      method: "POST",
      json: true,
      headers: {
        "content-type": "application/json",
      },
      body: data
    }, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log("请求成功");
        datas = response.body;
      }else{
        console.log(error);
      }
    });

    for(var i = 0 ; i<datas.length ; i++){
      var data = datas[i];
      var system = data.system; //"59562e0b3081e182a8097f8f"

      var audioModel = this.model("audio");

      params["seq"] = data.seq;
      params["sit_number"] = data.sit_number;
      params["customer.mobile"] = data.mobile;
      params["call_time"] = data.call_time;
      params["system"] = data.system;
      params["end_comment"] = data.end_comment;
      params["satisfy_comment"] = data.satisfy_comment;
      params["customer.name"] = data.customer;
      params["radio_path"] = data.radio_path;
      params["upload_audio.upload_audio_size"] = data.radio_size;
      params["end_comment"] = data.end_comment;
      params["satisfy_comment"] = data.satisfy_comment;
      var radio_name = data.radio_path.split("/").pop();
      params["upload_audio.upload_audio_name"] = radio_name;
      var result = {
        code:"20000",
        msg :"成功"
      };
      yield function(callback){
        audioModel.findOneAndUpdateRow({"upload_audio.upload_audio_name":radio_name}, params, function(err, row) {
          if (err) {
            status=400;
            result = {
              code:"20001",
              msg :"记录更新失败"
            };
            log(err);
          }
          callback();
        });
      }

    }

    this.status = status;
    this.body = result;
  });

}
