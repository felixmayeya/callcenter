module.exports = function ($){

    $.get("/", function *(next) {

        var self = this;

        //将session放入ejs渲染数据中
        self.state.session = self.session;

        if (!self.session.user) {
          self.redirect('/login');
          return;
        }
        var _params = this.request.query;
        var results={};
        if(this.redis.status === 'ready'){
            yield function(next){
              this.redis.set('foo', 'bar', function(err, res){
                  next();
              });
            };

            yield function(next){
               this.redis.get('foo', function (err, res) {
                    result = res;
                    next();
                });
            };
        }
        var audioModel = this.model("audio");

        var userModel=this.model("user");
        var rowList;
        yield function(callback) {
          userModel.getRows({'role':'worker'},function(err,row){
            if (!err && row) {
              rowList = row;
            }
            callback();
          })
        }
        //获取到所有质检员信息
        var qa_processlist = [];
        for(var x = 0; x < rowList.length; x++){

            var num1 = "";
            var num2 = "";
            var num3 = "";

            //未质检
            yield function(callback1) {
                var audio_params = {};
                var start_time = _params["from"]?_params["from"] : "";
                var end_time = _params["to"]?_params["to"] : "";
                var system =  _params["system"] ? _params["system"] : "";
                if( "" != system && system !="all" ){
                  audio_params["system"] = system;
                }

                if( "" != start_time && start_time !='' &&  "" != end_time && end_time !=''){
                  audio_params["start_date"] = { "$gte": start_time};
                  audio_params["completed_date"] = { "$lt": end_time};
                }
                audio_params.qa_person = rowList[x]._id;
                audio_params["audio_status.manual_inspection_status"] = 0;
                audioModel.getRowsCount(audio_params, function(err2, count1) {
                if (!err2) {
                  num1 = count1;
                }
              callback1();
            })

            }
            //已质检
            yield function(callback2) {
                var audio_params_2 = {};
                var start_time = _params["from"]?_params["from"] : "";
                var end_time = _params["to"]?_params["to"] : "";
                var system =  _params["system"] ? _params["system"] : "";
                if( "" != system && system !="all" ){
                  audio_params_2["system"] = system;
                }
                if( "" != start_time && start_time !='' &&  "" != end_time && end_time !=''){
                  audio_params_2["start_date"] = { "$gte": start_time};
                  audio_params_2["completed_date"] = { "$lt": end_time};
                }
                audio_params_2.qa_person = rowList[x]._id;
                audio_params_2["audio_status.manual_inspection_status"] = 1;
                audioModel.getRowsCount(audio_params_2, function(err3, count2) {
                if (!err3) {
                  num2 = count2;
                }
              callback2();
            })

            }
            //预期未质检
            yield function(callback3) {
               var audio_params_3 = {};
                var start_time = _params["from"]?_params["from"] : "";
                var end_time = _params["to"]?_params["to"] : "";
                var system =  _params["system"] ? _params["system"] : "";
                if( "" != system && system !="all" ){
                  audio_params_3["system"] = system;
                }
                if( "" != start_time && start_time !='' &&  "" != end_time && end_time !=''){
                  audio_params_3["start_date"] = { "$gte": start_time};
                  audio_params_3["completed_date"] = { "$lt": end_time};
                }
                audio_params_3.qa_person = rowList[x]._id;
                audio_params_3["audio_status.manual_inspection_status"] = 0;
                audio_params_3["completed_date"] = {"$lt": Number(Date.parse(new Date()))};

                audioModel.getRowsCount(audio_params_3, function(err4, count3) {
                if (!err4) {
                  num3 = count3;
                }
              callback3();
            })

            }

            var total_num = parseInt(num1)+parseInt(num2);
            var qa_pro = "";
            if(total_num==0){
              qa_pro = "~%";
            }else{
              qa_pro = parseInt(num2) / total_num * 100 + "%";
            }

            qa_processlist.push({
              person_id     : rowList[x]._id,
              person_name   : rowList[x].username,
              total_number  : total_num,
              qa_number     : parseInt(num2),
              nonqa_number  : parseInt(num1),
              overdue_number: parseInt(num3),
              qa_process    : qa_pro
            });
        }
        results.qa_processlist = qa_processlist;
        results.title = "首页";
        console.log(results)
        yield self.render('index', results);
    });

    $.get("/init", function*(next) {
      var self = this;

      var adminModel = self.model("admin");

      var crypto = require('crypto');
      var md5 = crypto.createHash('md5');
      md5.update('admin', 'utf8');
      var password = md5.digest('hex');

      yield function(callback) {
        adminModel.getRow({
          username: 'admin'
        }, function(err, row) {
          if (row) {
            adminModel.updateRow({
              username: 'admin'
            }, {
              password: password,
              role: 'admin'
            }, function(err, row) {
              if (err) {
                self.body = "failed"
              } else {
                self.body = "success"
              }

              callback();
            });
          } else {
            adminModel.createRow({
              username: 'admin',
              password: password,
              role: 'admin'
            }, function(err, row) {
              if (row) {
                self.body = "success";
              } else {
                self.body = "failed"
              }
              callback();
            });
          }
        });
      }
    });

    $.get("/redis", function *(next) {
      var self = this;
      var appModel = this.model("app");
      yield function(callback) {
        appModel.getRows({}, function(err, rows) {
          if (!err && rows) {
            for(var i in rows){
              var app_key = rows[i].app_key;
              var app_secret = rows[i].app_secret;
              self.redis.set(app_key, app_secret);
            }
          } else {
          }
          callback();
        });
      }
      this.body = 'loaded!';
    });


    //账号登录
    $.get("/login", function*(next) {
      var self = this;
      yield self.render('login', {
        layout: 'layout_login',
        title: '登录'
      });
    });

    $.post("/login", function*(next) {
      var self = this;
      var _params = self.request.fields;
      console.log(_params)
      if (self.validate(_params, {
        username: "required",
        password: "required"
      }).length !== 0) {
        self.status = 400;
        self.body = '参数有误';
        return;
      }

      var userModel = self.model("user");

      var username = _params["username"];
      var password = _params["password"];
      var params = {
        username: username,
        password: password
      };

      yield function(callback) {
        userModel.getRow(params, function(err, row) {
          if (!err && row) {
            self.status = 201;
            self.session.user = row;
            self.body = row;
          } else {
            self.status = 400;
            self.body = {};
          }
          callback();
        });
      }
    });

    $.get("/logout", function*(next) {
      var self = this;
      self.session = null;
      self.redirect('/login');
    });

    $.get("/parse", function*(next) {
      var Parser = this.library("logic_parser").Parser;
      var expression = this.request.query.exp;
      var parser = new Parser(expression);
      exp = parser.parse();
      this.status = 200;
      this.body = JSON.stringify(exp);
    });

};
