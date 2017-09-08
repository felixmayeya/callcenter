module.exports = function($) {

  //01.查询批量导入记录
  $.get("/audios", function*(next) {
    var self = this;
    self.state.session = self.session;
    if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
      self.redirect('/login');
      return;
    }
    var _params = this.request.query;
    var result = {};
    var params = {};
    var offset = _params.offset ? _params.offset : 0;
    var limit = _params.limit ? _params.limit : config.get("limit");

    var appModel = this.model("import");
    yield function(callback) {
      appModel.getRowsCount(params, function(err, count) {
        totalPage = Math.ceil(count / limit);
        appModel.getPagedRows(params,offset,limit,{end_time:-1}, function(err, rows) {
          if (err) {
            status = 400;
          } else {
            result = {
              rows: rows,
              offset: offset,
              limit: limit,
              totalPage: totalPage,
            };
          }
          callback();
        });
      });
    }

    result.title =  '批量导入';
    var common = self.library("common");
    result.common = common;
    yield self.render('/audios/audios', result);
  });

  //02.添加导入配置信息
  $.post("/audios/importConfigAdd", function*(next) {
    var self = this;
    self.state.session = self.session;
    if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
      self.redirect('/login');
      return;
    }
    var _params = this.request.fields;
    var status = 201;
    var result = {};
    yield function(callback) {
      var appModel = this.model("import_config");
      appModel.createRow(_params, function(err, row) {
        if (!err && row) {
          result = {
            code : "20000"
          };
          status = 201;
        } else {
          result = "更新失败!";
          status = 400;
        }
        callback();
      });
    };
    this.status = status;
    this.body = result;
  });

  //03.编辑拷贝方式文件导入配置信息
  $.put("/audios/importConfigEdit/:_id", function*(next) {
    var self = this;
    self.state.session = self.session;
    if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
      self.redirect('/login');
      return;
    }
    var _id = this.params._id;
    var params = this.request.fields.editList;

    var status = 200;
    var result = {};
    var taskModel = this.model("import_config");
    yield function(callback) {
      taskModel.findOneAndUpdateRow({ _id: _id }, JSON.parse(params), function(err, row) {
        if (!err && row) {
          result = {
            code : "20000"
          };
        } else {
          status = 401;
        }
        callback();
      });
    };
    this.status = status;
    this.body = result;
  });

  //04.CSV方式导入文件
  $.get("/import/csv", function*(next){
    var self = this;
    var fs = require("fs");
    var status = 200
    var result = {};
    var importConfigModel=self.model("import_config");
    //联调完毕，将audioTest 改成audio表
    var audioModel=self.model("audio");
    var ruleScoreModel = self.model('rule_score');
    var ruleModel = self.model('rule');
    var ruleWeightModel = self.model("rule_weight");
    var ruleThreshold = self.model("rule_threshold");
    var noticeModel=self.model("notice");
    var ruleKeyword = self.model("rule_keyword");
    var importModel = self.model("import");

    yield function(callback) {
      importConfigModel.getRow({},function(err,row){
        if (!err && row) {
          result = row;
        } else {
          status = 400;
        }
        callback()
      });
    }

    var system = result.system;
    var item = result["items"];

    var results = [];
    var t_table = 0;
    var importCallstat = self.library("import_callstat");
    var files_path_f = result.files_path;
    var audio_file_server_path = result.radio_path;


    //01判断话单文件是否存在
    var isExists = fs.existsSync(result.files_path);
    if(!isExists){
      result = {
        code : "30000"
      };
    }else{
      //判断是何种文件类型，分别调用不同种方法；CSV; JSON; XML
      var paramss = [];
      //CSV
      if(result.file_type == "0"){
        paramss =  importCallstat.importCallStats(result.files_path,item);
      }
      //JSON
      if(result.file_type == "1"){
        paramss =  importCallstat.importJSONStats(result.files_path,item);
      }
      //XML
      if(result.file_type == "2"){
        paramss =  importCallstat.importXMLStats(result.files_path,item);
      }

      if(JSON.stringify(paramss) == "[]"){
        this.status = status;
        this.body = {
          code : "20002",
          msg : "csv文件内容格式错误，无法解析"
        };
        return;
      }else{
        fs.unlinkSync(result.files_path);
      }

      yield function(callback){
        paramss.forEach(function(params){
          params.system = system;
          var result = {};
          t_table ++;
          //{seq : params.seq},
          audioModel.createRow(params, function(err, row) {
            if(err){
              status = 400;
              console.log(err)
            }
            callback();
          });
        });
      }

      //更新批次信息到import表中
      var _params1 = {};
      var uuid = require('node-uuid')();
      _params1.batch_number = uuid;//uuid.toUpperCase();
      _params1.import_date = new Date().getTime();
      _params1.start_time = new Date().getTime();
      _params1.total = t_table;
      _params1.success = t_table;
      _params1.failure = 0;
      _params1.operation_type = 0;
      _params1.person = this.session.user.username;

      yield function(callback) {
        importModel.createRow(_params1, function(err, row) {
          if (!err && row) {
            result = {
              code : "20000"
            };
          } else {
            result = "更新失败!";
            status = 400;
          }
          callback();
        });
      }


      var log = console.log.bind(console);

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
      log(keywordsResult);

      //根据系统查询智能质检权重
      var ruleWeight={};
      yield function(callback){
        ruleWeightModel.getColumnRow({system : system},{intelligent:1,artificial:1},function(err,row){
          if(!err && row){
            ruleWeight = row;
          }
          callback();
        })
      }
      log("根据系统查询智能质检权重分值"+ruleWeight.intelligent+"...\n");

      //根据系统查询规则评分
      log("根据系统查询所有规则评分...\n");
      var ruleScores = [];
      yield function(callback){
        ruleScoreModel.getColumnRows({system : system , rule_base : "智能质检评分规则库"},{score:1,user:1,rule:1,rule_type:1},function(err,rows){
          if(!err && rows){
            ruleScores = rows;
          }
          callback();
        })
      }
      log(ruleScores);


      //根据规则评分中的规则id循环查询规则内容
      log("根据规则评分查询所有规则内容...\n");
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
          }else{
            callback();
          }
        });
      }
      log(rulesResult);

      //根据规则评分中的阈值id循环查询阈值内容
      log("根据规则评分查询阈值内容...\n");
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
          }else{
            callback();
          }
        });
      }
      log(weightsResult);

      //执行拷贝、语音引擎转换、解析xml结果文件
      var SSH2Utils = require('ssh2-utils');
      var ssh = new SSH2Utils();
      var engine_server = config.get("engine_server");
      var engine_server_username = config.get("engine_server_username");
      var engine_server_password = config.get("engine_server_password");
      var upload_voice_path = config.get("upload_voice_path");
      var conver_xml_path = config.get("conver_xml_path");
      var audio_file_server = config.get("audio_file_server");
      var audio_file_server_username =  config.get("audio_file_server_username");
      var audio_file_server_password =  config.get("audio_file_server_password");

      var server = { host : engine_server , username : engine_server_username , password : engine_server_password };
      log("开始执行文件下载脚本......");
      var download_params = audio_file_server_username+' '+audio_file_server+' '+audio_file_server_path+'/* '+ upload_voice_path+' '+audio_file_server_password;

      ssh.exec(server, './upload.sh ' + download_params, function(err,stdout,stderr){
        if(err){
          log("打印错误日志开始");
          log(err);
          noticeModel.createRow({content : "您的上传的批次号：\""+uuid+"\"的音频文件失败，请重新上传或者联系系统管理员"}, function(err, row) {
            if(err){
              log(err);
            }
          });
          log("打印错误日志结束");
        } else{
          if(new RegExp("ok").test(stdout)){
            log("文件下载脚本download.sh执行结束");
            noticeModel.createRow({content : "您的上传的批次号：\""+uuid+"\"的音频文件已经上传完成，正在进行语音转换，请耐心等待..."}, function(err, row) {
              if(err){
                log(err);
              }
            });
            log("开始执行语音转换脚本......");
            var a = 0;
            var b = 0;
            var c = 0;
            ssh.run(server, config.get("conver_voice_shell")+' -v '+upload_voice_path+' -x '+ conver_xml_path, function(err,stdout,stderr){
              if(err){
                log("打印错误日志开始");
                log(err);
                noticeModel.createRow({content : "您的上传的批次号：\""+uuid+"\"的音频文件执行语音转换引擎失败，请重新上传文件或联系系统管理员"}, function(err, row) {
                  if(err){
                    log(err);
                  }
                });
                log("打印错误日志结束");
              } else{

                stdout.on('data', function(data){
                  log(data.toString());
                  if(new RegExp("The Result to Xml Begin").test(data)){
                    a = 0;
                  }else if(new RegExp("The Result to Xml End").test(data)){
                    b = 0;
                  }else if(new RegExp("The Task Over").test(data)){
                    c = 1;
                  }else{
                    a ++;
                    b ++;
                  }
                  console.log("*********111111111111111********************");
                  console.log(a);
                  console.log("*********222222222222222********************");
                  console.log(b);
                  console.log("*********333333333333333********************");
                  console.log(c);
                  console.log("*********444444444444444********************");

                  if(a-b>1  && c>0){

                    log("语音转换脚本run.sh执行结束");
                    log("开始执行解析xml结果");
                    //发送消息通知
                    noticeModel.createRow({content : "您的上传的批次号：\""+uuid+"\"的音频文件已经转换完成，正在进行文件解析和语音分析"}, function(err, row) {
                      if(err){
                        log(err);
                      }
                    });


                    ssh.exec(server, './download.sh ' + conver_xml_path +' '+audio_file_server_username+' '+audio_file_server+' /home/ '+audio_file_server_password, function(err,stdout,stderr){
                      if(err){
                        log(err);
                        noticeModel.createRow({content : "您的上传的批次号：\""+uuid+"\"的音频文件转换后下载失败，请重新上传或者联系系统管理员"}, function(err, row) {
                          if(err){
                            log(err);
                          }
                        });
                      } else{
                        if(new RegExp("ok").test(stdout)){

                          //读取转换解析后的xml文件开始
                          var explorer_results =  explorer(conver_xml_path,keywordsResult,rulesResult,weightsResult,ruleWeight);
                          //更新质检结果
                          log("更新智能质检结果...\n");
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
                            });
                          });

                          //读取本地xml文件解析后将本地xml文件删除
                          emptyDir(conver_xml_path);
                          //删除远程文件
                          ssh.exec(server, './delete.sh ' + upload_voice_path + ' ' + conver_xml_path, function(err,stdout,stderr){
                            if(err)log(err);
                            log(stdout);
                            log(stderr);
                          });
                          noticeModel.createRow({content : "您上传的批次号：\""+uuid+"\"的音频文件已自动质检，您可以进行人工质检"}, function(err, row) {
                            if(err){
                              log(err);
                            }
                          });


                        }
                      }
                    });

                    // var SFTPS = require('sftps');
                    // var sftp = new SFTPS(server);
                    // sftp.get(conver_xml_path+"*", conver_xml_path) ;
                    // sftp.exec(function (err, res) {
                    //   if(err){
                    //     log(err);
                    //   }else{
                    //
                    //     //读取转换解析后的xml文件开始
                    //     var explorer_results =  explorer(conver_xml_path,keywordsResult,rulesResult,weightsResult,ruleWeight);
                    //     //更新质检结果
                    //     log("更新智能质检结果...\n");
                    //     explorer_results.forEach(function(explorer_result){
                    //       var radio_name = explorer_result.radio_name;
                    //       var params = explorer_result.params;
                    //       audioModel.findOneAndUpdateRow({"upload_audio.upload_audio_name":radio_name}, params, function(err, row) {
                    //         if (err) {
                    //           status=400;
                    //           result = {
                    //             code:"20001",
                    //             msg :"智能质检更新失败"
                    //           };
                    //           log(err);
                    //         }
                    //       });
                    //     });
                    //
                    //     //读取本地xml文件解析后将本地xml文件删除
                    //     emptyDir(conver_xml_path);
                    //     //删除远程文件
                    //     ssh.exec(server, './delete.sh ' + upload_voice_path + ' ' + conver_xml_path, function(err,stdout,stderr){
                    //       if(err)log(err);
                    //       log(stdout);
                    //       log(stderr);
                    //     });
                    //     noticeModel.createRow({content : "您上传的批次号：\""+uuid+"\"的音频文件已自动质检，您可以进行人工质检"}, function(err, row) {
                    //       if(err){
                    //         log(err);
                    //       }
                    //     });
                    //
                    //   }
                    // });

                  }

                });
                stderr.on('data', function(data){
                  log(''+data);
                });

              }
            });

          }
        }

      });

    }
    this.status = status;
    this.body = result;
  });

  /**
  *@desc 删除目录内文件内容
  *@param fileUrl 文件目录
  *@author fanxd
  */
  var emptyDir = function(fileUrl){
    var files = fs.readdirSync(fileUrl);//读取该文件夹
    files.forEach(function(file){
      var stats = fs.statSync(fileUrl+'/'+file);
      if(stats.isDirectory()){
        emptyDir(fileUrl+'/'+file);
      }else{
        fs.unlinkSync(fileUrl+'/'+file);
        console.log("删除文件"+fileUrl+'/'+file+"成功");
      }
    });
  }

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



  function sleep(numberMillis) {
    var now = new Date();
    var exitTime = now.getTime() + numberMillis;
    while (true) {
      now = new Date();
      if (now.getTime() > exitTime)
      return;
    }
  }

  //如果想在读取流和写入流的时候做完全的控制，可以使用数据事件。但对于单纯的文件复制来说读取流和写入流可以通过管道来传输数据。
  var fs = require("fs");
  var path = require("path");
  /*
  * 复制目录中的所有文件包括子目录
  * @src param{ String } 需要复制的目录  例 images 或者 ./images/
  * @dst param{ String } 复制到指定的目录  例 images images/
  */
  //获取当前目录绝对路径，这里resolve()不传入参数
  var filePath = path.resolve();
  var copy = function(src,dst){
    //判断文件需要时间，则必须同步
    if(fs.existsSync(src)){
      fs.readdir(src,function(err,files){
        if(err){console.log(err);return;}
        files.forEach(function(filename){
          //url+"/"+filename不能用/直接连接，Unix系统是”/“，Windows系统是”\“
          var url = path.join(src,filename),
          dest = path.join(dst,filename);
          fs.stat(path.join(src,filename),function(err, stats){
            if (err) throw err;
            //是文件
            if(stats.isFile()){
              //创建读取流
              readable = fs.createReadStream(url);
              //创建写入流
              writable = fs.createWriteStream(dest,{ encoding: "utf8" });
              // 通过管道来传输流
              readable.pipe(writable);
              //如果是目录
            }else if(stats.isDirectory()){
              exists( url, dest, copy );
            }
          });
        });
      });
    }else{
      console.log("给定的目录不存，读取不到文件");
      return;
    }
  }
  function exists(url,dest,callback){
    fs.exists(dest,function(exists){
      if(exists){
        callback && callback(url,dest);
      }else{
        //第二个参数目录权限 ，默认0777(读写权限)
        fs.mkdir(dest,0777,function(err){
          if (err) throw err;
          callback && callback(url,dest);
        });
      }
    });
  }
  exports.copy = copy;


  //遍历读取文件，获取文件总计大小
  function getFileTotalSize(path)
  {
    var totalSize = 0;
    files = fs.readdirSync(path);//需要用到同步读取
    files.forEach(walk);
    function walk(file)
    {
      states = fs.statSync(path+'/'+file);
      //创建一个对象保存信息
      var obj = new Object();
      var size = states.size;//文件大小，以字节为单位
      totalSize += parseInt(size);
    }
    return totalSize;
  }

  //05.查询文件拷贝方式的设置内容信息
  $.get("/audios/upload_config", function*(next) {
    var self = this;
    self.state.session = self.session;
    if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
      self.redirect('/login');
      return;
    }
    var _params = this.request.query;
    var result = {};
    var params = {};
    var offset = _params.offset ? _params.offset : 0;
    var limit = _params.limit ? _params.limit : config.get("limit");

    var appModel = this.model("import_config");
    yield function(callback) {
      appModel.getRow(params, function(err, row) {
        if (!err && row) {
          status = 200;
          result.row = row;
        } else {
          status = 404;
        }
        callback();
      });
    }

    //系统列表
    var systemModel = this.model("system")
    yield function(callback) {
      systemModel.getColumnRows({},{name:1},function(err,rows){
        if (err) {
          status = 400;
        } else {
          result.systemList = rows;
          callback()
        }
      })
    }

    result.title =  '导入配置';
    var common = self.library("common");
    result.common = common;
    yield self.render('/audios/upload_config', result);
  });


  /**
  * @desc 验证上传文件名是否存在
  * @param name 上传文件名（精确查询）
  * @author bcl
  */
  $.get("/audios/upload/:name", function*(next){
    var self = this;
    //将session放入ejs渲染数据中
    self.state.session = self.session;
    //admin 或 manager 角色才可访问
    if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
      self.redirect('/login');
      return;
    }

    var result = {};
    var status = 200;
    var params = {};
    var name = this.params.name;
    if(name!=''){
      params["upload_audio.upload_audio_name"] = name;
    }

    var audioModel = this.model("audio");
    yield function(callback){
      audioModel.getRowsCount(params,function(err,count){
        if(err){
          status = 400;
          result="验证上传文件名失败";
        }else{
          if(count<1){
            result = {
              status : 20000
            }
          }else if(count>1){
            result={
              status :20002
            }
          }else{
            result={
              status :20001
            }
          }
        }
        callback();
      });
    }

    this.status = status;
    this.body = result;
  })


  /**
  *@desc 单文件上传页面渲染
  *@author bcl
  */
  $.get("/audios/upload", function*(next){
    var self = this;
    //将session放入ejs渲染数据中
    self.state.session = self.session;
    //admin 或 manager 角色才可访问
    if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
      self.redirect('/login');
      return;
    }
    var result = {};
    var status =200;
    var systemModel = this.model("system");
    yield function(callback) {
      systemModel.getColumnRows({},{name:1},function(err, rows) {
        if (!err && rows) {
          result.systemList=rows;
        }
        callback();
      })
    }
    var usergroupModel = this.model("user_group");
    yield function(callback) {
      usergroupModel.getColumnRows({type:"omni"},{name:1},function(err, rows){
        if (!err && rows) {
          result.usergroupList=rows;
        }
        callback();
      })
    }
    var userModel = this.model("user");
    yield function(callback) {
      userModel.getColumnRows({role:"omni"},{_id:0,sit_number:1,username:1,user_group:1},function(err, rows){
        if (!err && rows) {
          result.userList=rows;
        }
        callback();
      })
    }

    result.title =  '文件上传';
    var common = self.library("common");
    result.common = common;
    yield self.render('/audios/upload', result);
  })

  /**
  *@desc 文件上传
  *@author bcl
  */
  $.post("/audios/upload", function*(next) {
    var self = this;
    var result ="";
    var status = 200;
    yield function(callback) {
      var self = this;
      var result = {};
      if (this.request.files && this.request.files.length > 0) {
        var fs = require('fs');
        var fse = require('fs-extra');
        var path = require('path');
        var CONSTANT_ROOT = __dirname;
        var _params = this.request.query;

        var size = this.request.files[0].size;
        var fileSize={};
        if(size/1024 > 1024){
          if(size/(1024*1024)>1024){
            fileSize = (size/(1024*1024*1024)).toFixed(1)+"GB";
          }else{
            fileSize = (size/(1024*1024)).toFixed(1)+"MB";
          }
        }else{
          fileSize = (size/1024).toFixed(1)+"KB";
        }

        //文件名
        var file_name = this.request.files[0].name;
        //文件后缀
        var file_type = path.extname(file_name);
        //保存的文件路径
        var file_path = config.get("upload_voice_path");

        fs.exists(file_path, function(exists) {
          if (exists) {
            console.log("文件夹已存在")
          } else {
            fs.mkdir(file_path,function(err){
              if (err) {
                return console.error(err);
              }
              console.log("目录创建成功");
            });
          }
        });

        // var file_path = "/tmp/mozilla_bcl0/";
        var fname = path.basename(file_name, file_type) + file_type;
        fse.ensureDirSync(file_path);
        //将上传的文件移动到新的路径下
        var src = this.request.files[0].path;
        var dest = file_path + "/" + fname;
        var readStream = fs.createReadStream(src);
        var writeStream = fs.createWriteStream(dest);
        readStream.pipe(writeStream);

        //创建
        var _params = {};
        _params['upload_audio.upload_audio_name'] = file_name;
        _params['upload_audio.upload_audio_size'] = fileSize;
        _params['upload_audio.pload_audio_type'] = 0;

        var audioModel = this.model("audio");
        audioModel.findOneAndUpdateRow({"upload_audio.upload_audio_name":file_name}, _params, function(err, row) { });
        readStream.on('end', function () {
          result.status = status;
          callback();
        });
      }
    }
    this.status = status;
    this.body = result;
  })

  /**
  *@desc 上传单个文件的话单记录
  *@author fanxd
  */
  $.post("/audios/upload/callstat", function*(next) {
    var self = this;
    var result = {};
    var status = 200;
    var callstat = this.request.fields.callstat;
    console.log(callstat);

    var params = JSON.parse(callstat);
    console.log(params);
    yield function(callback) {
      //创建
      var audioModel = this.model("audio");
      //上传语音的时候，将语音文件类型设置成为 2：语音上传
      params.radio_type = 2;
      params["audio_status.upload_status"] = 1;
      var radio_name = params.radio_path.split("/").pop();
      params["upload_audio.upload_audio_name"]=radio_name;
      params.call_time = Number(new Date(params.call_time).getTime());
      console.log(params);


      audioModel.createRow(params, function(err, row) {
        if(!err && row){
          result={
            code :"20000",
            msg : "话单插入成功"
          }
        }else{
          status = 400;
          result={
            code :"20001",
            msg : "话单插入失败"
          }
        }
        callback();
      });
    }
    this.status = status;
    this.body = result;
  })



  // 删除上传数据
  $.delete("/audios/:_id",function*(next){
    var self = this;
    var result={};
    var _id = (this.params._id).split(",");
    var audioModel = this.model("audio");
    var status =201;
    yield function(callback){
      for(var i=0;i<_id.length;i++){
        audioModel.deleteRow({_id: _id[i]},function(err,row){
          if(!err && row){
            status=200;
            result={
              app:row
            }
          }else{
            status=400;
            result="删除数据失败";
          }
          callback();
        })
      }

    }
    this.status = status;
    this.body=result;
  });

}
