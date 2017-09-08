module.exports = function($) {
  //质检查询列表
  $.get("/inspections", function*(next) {
    var self = this;
    //将session放入ejs渲染数据中
    self.state.session = self.session;

    //admin 或 manager 角色才可访问
    if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager' || self.session.user.role == 'worker' || self.session.user.role == 'chargeman')) {
      self.redirect('/login');
      return;
    }
    var _params = this.request.query;
    var params = {};
    var result = {};
    var status = 200;

    if(self.session.user.role == 'chargeman'){
      params.qa_group = self.session.user.user_group;
    }
    if(self.session.user.role == 'worker'){
      params.qa_person = self.session.user._id;
    }
    var offset = _params.offset ? _params.offset : 0;
    var limit = _params.limit ? _params.limit : config.get("limit");

    //坐席工号查询
    var sitNumber = _params["sit_number"] ? _params["sit_number"] : "";
    if (sitNumber === 'all') {
      sitNumber = ''
    }
    if (sitNumber !== '') {
      params.sit_number = sitNumber;
    }
    //质检员查询
    var assignTo = _params["assign_to"] ? _params["assign_to"] : "";
    if (assignTo === "all") {
      assignTo = ''
    }
    if (assignTo !== '') {
      params.qa_person = assignTo;
    }
    var qaStatus = _params["qa_status"] ? _params["qa_status"] : "";
    if (qaStatus === 'all') {
      qaStatus = ''
    }
    if (qaStatus !== '') {
      // params.status = new RegExp(qaStatus, 'i');
      params['audio_status.manual_inspection_status'] = Number(qaStatus)
    }

    var from = _params["from"] ? _params["from"] : "";
    var to = _params["to"] ? _params["to"] : "";
    if (from !== '' && to !== '') {
      params["call_time"] = { "$gte": from, "$lt": to };
    }
    var audioModel = this.model("audio");
    yield function(callback) {
      audioModel.getPagedRows(params, offset, limit, {
        created: -1
      }, function(err, rows) {
        if (err) {
          status = 400;
        } else {
          result = {
            rows: rows,
            qaStatus: qaStatus,
            sit_number: sitNumber,
            assign_to: assignTo,
            from: from,
            to: to,
            offset: offset,
            limit: limit
          };
          callback();
        }
      });
    }

    //总页数
    yield function(callback) {
      audioModel.getRowsCount(params, function(err, count) {
        if (err) {
          status = 400;
        } else {
          var totalPage = Math.ceil(count / limit);
          result.totalPage = totalPage;
          callback()
        }
      })
    }

    //质检员列表
    var userModel = this.model("user")
    yield function(callback) {
      userModel.getColumnRows({'role':'worker'},{username:1},function(err,rows){
        if (err) {
          status = 400;
        } else {
          result.workerList = rows;
          callback()
        }
      })
    }
    yield function(callback) {
      userModel.getColumnRows({'role':'omni'},{sit_number:1,username:1},function(err,rows){
        if (err) {
          status = 400;
        } else {
          result.sitList = rows;
          callback()
        }
      })
    }

    //系统列表
    var systemModel = this.model("system")
    yield function(callback) {
      systemModel.getRows({},function(err,row){
        if (err) {
          status = 400;
        } else {
          var systemList = row;
          result.systemList = systemList;
          callback()
        }
      })
    }
    result.title = '质检结果';

    var common = self.library("common");
    result.common = common;
    yield self.render('inspections/inspections', result);
  });

  //质检结果详情
  $.get("/inspection/:type/:_id", function* (next) {
    var self = this;

    //将session放入ejs渲染数据中
    self.state.session = self.session;

    //admin 或 manager 角色才可访问
    if (!self.session.user ) {
      self.redirect('/login');
      return;
    }

    var _id = this.params._id;
    var type = this.params.type;
    //类型是学习 更新开始学习时间并且只在第一次更新
    if(type === "study"){
      var distributeModel=this.model("distribute");
      var distribute = {};
      yield function(callback){
        distributeModel.getRow({audio_id:_id},function(err,row){
          if(!err){
            distribute = row;
          }
          callback();
        });
      }
      distribute.status = 3;
      distribute.last_start_time = distribute.start_time;
      distribute.start_time = Date.now();
      distribute.last_end_time = distribute.end_time;
      distribute.last_study_duration = distribute.study_duration;
      distribute.study_count = distribute.study_count+1;

      yield function(callback){
        distributeModel.updateRow({audio_id : _id},distribute,function(err,row){
          if(err){
            console.log(err);
          }
          callback();
        });
      }
    }

    var status = 200;
    var result = {};
    var audioModel = this.model("audio");
    yield function (callback) {
      audioModel.getRow({ _id: _id }, function (err, row) {
        if (!err && row) {
          status = 200;
          result = row;
        } else {
          status = 404;
        }
        callback();
      });
    }
    this.status = status;
    this.body = result;
  });

  //质检结果下载列表
  $.get("/inspections/download", function*(next) {
    var self = this;
    //将session放入ejs渲染数据中
    self.state.session = self.session;

    //admin 或 manager 角色才可访问
    if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager' || self.session.user.role == 'chargeman')) {
      self.redirect('/login');
      return;
    }
    var _params = this.request.query;
    var params = {};
    var result = {};
    var status = 200;
    // 保存的文件下载路径
    var iconv = require('iconv-lite');

    var fileName = "质检结果统计_"+new Date().format("yyyyMMddhhmm")+".csv";
    var csvfile = "";
    var osType = _params["os_type"] ? _params["os_type"] : "";


    var qaStatus = _params["qa_status"] ? _params["qa_status"] : "";
    if(qaStatus === 'all'){
      qaStatus = ''
    }
    if (qaStatus != '') {
      params.status = qaStatus
    }

    var startTime = _params["from"]?_params["from"] : "";
    var endTime = _params["to"]?_params["to"] : "";
    if(startTime!==''&&endTime!==''){
      params["call_time"] = { "$gte": startTime, "$lt": endTime};

    }
    //系统列表
    var systemModel = this.model("system")
    var systemList;
    yield function(callback) {
      systemModel.getRows({}, function(err, sys) {
        if (err) {
          status = 400;
        } else {
          systemList = sys;
        }
        callback()
      })
    }
    var audioModel = this.model("audio");
    yield function(callback) {
      audioModel.getRows(params, function(err,rows) {
        if (err) {
          status = 400;
        } else {
          var csv = require("fast-csv")
          var fs =  require("fs")
          var csvStream = csv
          .format({headers: true})
          .transform(function(row){
            return {
              序号:row.no,
              录音流水号:row._id,
              呼叫时间:row.call_time_format,
              所属业务:row.system_name,
              客户名称:row.customer.name,
              话后总结:row.end_comment,
              满意度评价:row.satisfy_comment,
              通话总时长:row.call_duration,
              静音比	:row.mute_ratio,
              用户语速:row.customer_speed,
              坐席语速:row.agent_speed,
              静音总时长:row.mute_duration,
              质检状态:row.assignStatus
            };
          });
          var common = self.library("common");

          fs.exists(fileName, function(exists) {
            if(exists){
              fs.unlinkSync(fileName);
            }
          });

          writableStream = fs.createWriteStream(fileName);

          writableStream.on("finish", function(){
            console.log("wirte to csv ok!");
          });
          csvStream.pipe(writableStream);
          for(var i in rows){
            var call_time_format= new Date(rows[i].call_time).format("yyyy-MM-dd hh:mm");
            rows[i].call_time_format = call_time_format;
            rows[i].no = Number(i)+1;
            if(rows[i]['audio_status'].manual_inspection_status==0){
              rows[i].assignStatus="未质检";
            }
            if(rows[i]['audio_status'].manual_inspection_status==1){
              rows[i].assignStatus="已质检";
            }
            if(rows[i]['audio_status'].manual_inspection_status==2){
              rows[i].assignStatus="不予质检";
            }
            for(var j in systemList){
              if(rows[i].system == systemList[j]._id){
                rows[i].system_name = systemList[j].name;
              }
            }
            csvStream.write(rows[i]);
          }
          csvStream.end();

          if(osType === "linux"){
            csvfile = fs.createReadStream(fileName);
          }else{
            csvfile = fs.createReadStream(fileName)
            .pipe(iconv.decodeStream('utf-8'))
            .pipe(iconv.encodeStream('GBK'));
          }
          self.set('Content-Type', 'application/x-msdownload;charset=UTF-8');
          self.set('Content-Disposition', 'attachment; filename='+encodeURIComponent(fileName,"utf-8"));

        }
        callback();
      });
    }
    this.body = csvfile;
  });

  $.get("/inspections/:qa_id", function*(next) {
    var self = this;
    //将session放入ejs渲染数据中
    self.state.session = self.session;

    //admin 或 manager 角色才可访问
    if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
      self.redirect('/login');
      return;
    }
    var qa_id = this.params.qa_id;
    var status = 200;
    var result = {};
    var appModel = this.model("audio");
    yield function(callback) {
      appModel.getRow({ _id: qa_id }, function(err, row) {
        if (!err && row) {
          status = 200;
          result = row;
        } else {
          status = 404;
        }
        callback();
      });
    }
    this.status = status;
    this.body = result;
  });
  //复议列表
  $.get("/inspections/reviews", function*(next) {
    var self = this;
    //将session放入ejs渲染数据中
    self.state.session = self.session;

    //admin 或 manager 角色才可访问
    if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager' )) {
      self.redirect('/login');
      return;
    }
    var _params = this.request.query;
    var params = {};
    var result = {};
    var status = 200;
    var offset = _params.offset ? _params.offset : 0;
    var limit = _params.limit ? _params.limit : config.get("limit");

    //复议状态：0 未申请 1 已申请,2 已评审,3 已驳回 all: 全部

    var recheckStatus = _params["recheck_status"] && _params["recheck_status"] !== "all"?_params["recheck_status"]:"";
    if(recheckStatus !=''){
      params.recheck_status = Number(recheckStatus.trim());
    }else{
      params.recheck_status = {$ne:0}
    }
    //2017-06-28 12:00:00- 2017-06-30 12:00:00

    var from = _params["from"] ? _params["from"] : "";
    var to = _params["to"] ? _params["to"] : "";
    if (from !== '' && to !== '') {
      params["call_time"] = { "$gte": from, "$lt": to };
    }
    console.log(params);
    var audioModel = this.model("audio");
    yield function(callback) {
      audioModel.getPagedRows(params, offset, limit, {
        created: -1
      }, function(err, rows) {
        if (err) {
          status = 400;
        } else {
          result = {
            rows: rows,
            recheckStatus: recheckStatus,
            from: from,
            to: to,
            offset: offset,
            limit: limit
          };
        }
        callback();
      });;
    }

    //总页数
    yield function(callback) {
      audioModel.getRowsCount(params, function(err, count) {
        if (err) {
          status = 400;
        } else {
          var totalPage = Math.ceil(count / limit);
          result.totalPage = totalPage;
          callback()
        }
      })
    }

    result.title = '复议审核';

    var common = self.library("common");
    result.common = common;
    yield self.render('inspections/reviews', result);
  })

  //更新复议状态
  $.put("/inspections/reviews/update/:audio_id", function*(next) {
    var self = this;
    var audio_id = this.params.audio_id;
    var _params = this.request.fields;
    var status = 201;
    var result = {};

    _params["audio_status.manual_inspection_status"] = _params['qaStatus'];
    _params["assign_status"] = 0;

    if(_params.qaInfo&&_params.qaInfo!=='') {
      var qaHistory = JSON.parse(_params.qaInfo);
      _params.qa_history = qaHistory
    }

    var audioModel = this.model('audio')
    console.log(_params)
    yield function(callback) {
      audioModel.findOneAndUpdateRow({ _id: audio_id }, _params, function(err, row) {
        if (!err && row) {
          status = 200;
          result = row;
        } else {
          status = 400;
          result = "更新失败";
        }
        callback();
      });
    }

    this.status = status;
    this.body = result;
  })

  // 复议下载列表
  $.get("/inspections/reviews/download", function*(next) {
    var self = this;
    //将session放入ejs渲染数据中
    self.state.session = self.session;

    //admin 或 manager 角色才可访问
    if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
      self.redirect('/login');
      return;
    }
    var _params = this.request.query;
    var params = {};
    var result = {};
    var status = 200;
    // 保存的文件下载路径
    var fileName = "qa_review.csv";
    var csvfile = "";
    var osType = _params["os_type"] ? _params["os_type"] : "";
    var iconv = require('iconv-lite');
    var recheckStatus = _params["recheck_status"] ? _params["recheck_status"] : "";

    //复议状态：0: 已申请' 1:'已评审' 2:'已驳回, all: 全部
    if (recheckStatus === 'all') {
      recheckStatus = ''
    }

    if (recheckStatus !== '') {
      params.recheck_status = Number(recheckStatus.trim());
    }

    //2017-06-28 12:00:00- 2017-06-30 12:00:00

    var startTime = _params["from"] ? _params["from"] : "";
    var endTime = _params["to"] ? _params["to"] : "";
    if (startTime !== '' && endTime !== '') {
      params["call_time"] = { "$gte": startTime, "$lt": endTime };
    }

    var audioModel = this.model("audio");
    yield function(callback) {
      audioModel.getRows(params, function(err,rows) {
        if (err) {
          status = 400;
        } else {
          var csv = require("fast-csv")
          var fs =  require("fs")
          var csvStream = csv
          .format({headers: true})
          .transform(function(row){
            return {
              序号:row.no,
              录音流水号:row._id,
              客户名称:row.customer.name,
              通话总时长:row.call_duration,
              静音总时长:row.mute_duration,
              呼叫时间:row.call_time_format,
              复议状态:row.recheck_status
            };
          });

          fs.exists(fileName, function(exists) {
            if(exists){
              fs.unlinkSync(fileName);
            }
          });

          writableStream = fs.createWriteStream(fileName);

          writableStream.on("finish", function(){
            console.log("wirte to csv ok!");
          });
          var common = self.library("common");
          csvStream.pipe(writableStream);
          for(var i in rows){
            var call_time_format= new Date(rows[i].call_time).format("yyyy-MM-dd hh:mm");
            rows[i].call_time_format = call_time_format;
            rows[i].no = Number(i)+1;
            csvStream.write(rows[i]);
          }
          csvStream.end();
          if(osType === "linux"){
            csvfile = fs.createReadStream(fileName);
          }else{
            csvfile = fs.createReadStream(fileName)
            .pipe(iconv.decodeStream('utf-8'))
            .pipe(iconv.encodeStream('GBK'));
          }
          self.set('Content-Type', 'application/x-msdownload;charset=UTF-8');
          self.set('Content-Disposition', 'attachment; filename='+encodeURIComponent(fileName,"utf-8"));
        }
        callback();
      });
    }
    this.body = csvfile;
  });

  //质检人员质检录音列表
  $.get("/inspect/:worker_id", function*() {
    var self = this;
    //将session放入ejs渲染数据中
    self.state.session = self.session;

    //admin 或 manager 角色才可访问
    if (!self.session.user || !(self.session.user.role == 'worker' || self.session.user.role == 'chargeman')) {
      self.redirect('/login');
      return;
    }

    var worker_id = this.params.worker_id;
    var _params = this.request.query;
    var params = {};
    var result = {};
    var status = 200;

    var offset = _params.offset ? _params.offset : 0;
    var limit = _params.limit ? _params.limit : config.get("limit");

    params.qa_person = worker_id

    var qaStatus = _params["qa_status"] ? _params["qa_status"] : "";
    if (qaStatus === 'all') {
      qaStatus = ''
    }
    if (qaStatus !== '') {
      // params.status = new RegExp(qaStatus, 'i');
      params['audio_status.manual_inspection_status'] = Number(qaStatus)
    }
    //2017-06-28 12:00:00- 2017-06-30 12:00:00

    var from = _params["from"] ? _params["from"] : "";
    var to = _params["to"] ? _params["to"] : "";
    if (from !== '' && to !== '') {
      params["call_time"] = { "$gte": from, "$lt": to };
    }

    var audioModel = this.model('audio')
    yield function(callback) {
      audioModel.getPagedRows(params, offset, limit, {
        created: -1
      }, function(err, rows) {
        if (err) {
          status = 400;
        } else {
          result = {
            rows: rows,
            qaStatus: qaStatus,
            from: from,
            to: to,
            offset: offset,
            limit: limit
          };
          callback();
        }
      });
    }

    //总页数
    yield function(callback) {
      audioModel.getRowsCount(params, function(err, count) {
        if (err) {
          status = 400;
        } else {
          var totalPage = Math.ceil(count / limit);
          result.totalPage = totalPage;
          callback()
        }
      })
    }

    //系统列表
    var systemModel = this.model("system")
    yield function(callback) {
      systemModel.getRows({},function(err,row){
        if (err) {
          status = 400;
        } else {
          var systemList = row;
          result.systemList = systemList;
          callback()
        }
      })
    }

    result.title = "录音质检";

    result.work_id = worker_id;
    result.common = self.library("common");
    yield self.render('inspections/inspection', result);
  })

  //录音质检
  $.get("/inspections/inspect/:audio_id", function*(next) {
    var self = this;

    //将session放入ejs渲染数据中
    self.state.session = self.session;

    //admin 或 manager 角色才可访问
    if (!self.session.user || self.session.user.role != 'worker') {
      self.redirect('/login');
      return;
    }

    var audio_id = this.params.audio_id

    var result = {};

    //获取标准话术信息
    var _params = this.request.query;
    var status = 200;
    var offset = _params.offset ? _params.offset : 0;
    var limit = _params.limit ? _params.limit : config.get("limit");
    var params = {};
    var ruleModel = this.model("rule_trick");
    yield function(callback) {
      ruleModel.getRowsCount(params, function(err, count) {
        totalPage = Math.ceil(count / limit);
      });
      ruleModel.getPagedRows(params, offset, limit, {
        created: -1
      }, function(err, rows) {
        if (err) {
          status = 400;
        } else {
          result = {
            trickRules: rows,
            offset: offset,
            limit: limit,
            totalPage: totalPage
          };
        }
        callback();
      });
    }

    //获取录音信息
    var audioModel = this.model('audio')
    yield function(callback) {
      audioModel.getRow({ _id: audio_id }, function(err, row) {
        if (!err && row) {
          status = 200;
          result.audioInfo = row;
        } else {
          status = 404;
        }
        callback();
      });
    }
    //获取人工质检分数
    var ruleWeightsModel = this.model('rule_weight')
    yield function(callback) {
      ruleWeightsModel.getRow({ system: result.audioInfo.system }, function(err, row) {
        if (!err && row) {
          status = 200;
          result.artificial = row.artificial;
        } else {
          status = 404;
        }
        callback();
      });
    }

    var ruleManualTypes = {}
    yield function(callback){
      var ruleManualTypeModel = this.model("rule_manual_type");
      ruleManualTypeModel.getColumnRows({},{"name":1,"content":1},function(err,rows){
        if(!err && rows){
          rows.forEach(function(row){
            ruleManualTypes[row._id] = {
              name : row.name,
              content : row.content
            }
          });
        }
        callback();
      });
    }

    result.title = '语音系统';
    var rules = [];
    yield function(callback){
      var appModel = this.model("rule_score");
      appModel.getColumnRows({system:result.audioInfo.system,rule_base:"人工质检评分规则库"},{rule:1,score:1},function(err,rows){
        if(!err && rows){
          rows.forEach(function(row){
            rules.push({
              type : ruleManualTypes[row.rule].name,
              score : row.score,
              reasons :ruleManualTypes[row.rule].content
            })
          })
          status=200;
        }
        callback();
      })
    }
    result.rules = rules;

    // result.rules = [{
    //   type: '业务知识',
    //   score: '10',
    //   reasons: [
    //     '业务资料提供正确，但漏给重点要素',
    //     '未按照规定流程为客户办理业务',
    //     '业务资料提供错误',
    //   ]
    // }, {
    //   type: '倾听能力',
    //   score: '10',
    //   reasons: [
    //     '屡次打断客户，不理会客户感受，自己滔滔不绝',
    //     '未能集中精神倾听客户问题，存在无效或重复提问，或完全听错，答非所问',
    //     '主管臆断客户问题，影响整体通话',
    //   ]
    // }, {
    //   type: '回应能力',
    //   score: '10',
    //   reasons: [
    //     '描述问题不够专业，过于口语化',
    //     '服务被动，回答问题过于简单，出现一问一答现象',
    //     '表达断断续续，不连贯',
    //     '与客户缺乏互动，或故意不回答客户问题',
    //     '客户在通话中因各种原因表现出投诉倾向或不满情绪，未能主动道歉安抚，对问题置之不理'
    //   ]
    // }, {
    //   type: '引导能力',
    //   score: '10',
    //   reasons: [
    //     '做了部分引导，但缺乏重点要素',
    //     '做了引导，但都是无效引导，不能分析客户问题',
    //     '错误引导，但后续通话中有补救措施',
    //     '引导性差，任凭客户唠叨或被客户带入其他话题，被客户压制无法接话，以敷衍结束通话'
    //   ]
    // }, {
    //   type: '标准话术',
    //   score: '10',
    //   reasons: [
    //     '未正确使用礼貌用语',
    //     '为恰当使用致谢语，致歉语',
    //     '未让客户做满意度调查',
    //   ]
    // }, {
    //   type: '理解能力',
    //   score: '10',
    //   reasons: [
    //     '未能及时理解客户意图，需要多次核实确认才能给予答复'
    //   ]
    // }, {
    //   type: '话后小结',
    //   score: '10',
    //   reasons: [
    //     '话后小结选择业务类型错误'
    //   ]
    // }]

    var reasons = [];
    yield function(callback){
      var ruleManualReasonModel = this.model("rule_manual_reason");
      ruleManualReasonModel.getColumnRows({},{name:1,content:1},function(err,rows){
        if(!err && rows){
          rows.forEach(function(row){
            reasons.push({
              labelType : row.name,
              labelDetail : row.content
            })
          })
        }
        callback();
      })
    }
    result.reasons = reasons;

    // result.reasons = [{
    //   'labelType': '业务知识差错',
    //   'labelDetail': '必须严格按照客服系统知识库、业务培训资料的规定、完成解答客户问题，以免对客户造成错误引导或产生误解'
    // },{
    //   'labelType': '客户投诉',
    //   'labelDetail': '因工作差错导致客户投诉'
    // },{
    //   'labelType': '客户投诉',
    //   'labelDetail': '因服务态度导致客户投诉'
    // },{
    //   'labelType': '客户表扬',
    //   'labelDetail': '受到客户表扬'
    // },{
    //   'labelType': '服务态度差',
    //   'labelDetail': '由于主观原因，出现服务态度差，责问客户，甚至与客户发生争执'
    // },{
    //   'labelType': '系统操作差错',
    //   'labelDetail': '未按照规范流程办理业务'
    // },{
    //   'labelType': '系统操作差错',
    //   'labelDetail': '因业务不熟悉或操作失误，出现未成功办理或错办业务的情况'
    // },{
    //   'labelType': '落地差错',
    //   'labelDetail': '记录信息错误'
    // },{
    //   'labelType': '落地差错',
    //   'labelDetail': '工作未在当天班次内及时处理'
    // },{
    //   'labelType': '落地差错',
    //   'labelDetail': '工作未在规定时间内及时回复客户'
    // }]

    var common = self.library("common");
    result.common = common;

    yield self.render('inspections/inspect', result);
  })

  //更新audio质检结果信息
  $.put("/inspection/submit/:audio_id", function*(next){
    var self = this;
    var audio_id = this.params.audio_id;
    var _params = this.request.fields;
    _params["audio_status.manual_inspection_status"] = _params["manual_inspection_status"];
    _params["qa_completed_date"] = Date.parse(new Date());
    _params["score"] = Number(_params["machine_score"]) + Number(_params["person_score"]);
    var status = 201;
    var result = {};

    var audioModel = this.model('audio')
    console.log(audio_id);
    console.log(_params)
    yield function(callback) {
      audioModel.findOneAndUpdateRow({ _id: audio_id }, _params, function(err, row) {
        if (!err && row) {
          status = 200;
          result = row;
        } else {
          status = 400;
          result = "更新失败";
        }
        callback();
      });
    }

    this.status = status;
    this.body = result;

  })
  //坐席质检结果
  $.get("/inspections/sit/:id", function*(next) {
    var self = this;
    //将session放入ejs渲染数据中
    self.state.session = self.session;

    var id = this.params.id;
    var _params = this.request.query;
    var params = {};
    var result = {};
    var status = 200;

    var offset = _params.offset ? _params.offset : 0;
    var limit = _params.limit ? _params.limit : config.get("limit");

    params.sit_number = id;


    var qaStatus = _params["qa_status"] && _params["qa_status"] !== "all"?_params["qa_status"]:"";
    if (qaStatus != '') {
      params.recheck_status = qaStatus;
    }
    var manual_inspection_status = _params["manual_inspection_status"] && _params["manual_inspection_status"] !== "all"?_params["manual_inspection_status"]:"";
    if (manual_inspection_status != '') {
      params["audio_status.manual_inspection_status"] = manual_inspection_status;
    }
    //2017-06-28 12:00:00- 2017-06-30 12:00:00

    var from = _params["from"] ? _params["from"] : "";
    var to = _params["to"] ? _params["to"] : "";
    if (from !== '' && to !== '') {
      params["call_time"] = { "$gte": from, "$lt": to };
    }

    var audioModel = this.model('audio')
    yield function(callback) {
      audioModel.getPagedRows(params, offset, limit, {
        created: -1
      }, function(err, rows) {
        if (err) {
          status = 400;
        } else {
          result = {
            rows: rows,
            qaStatus: qaStatus,
            manual_inspection_status:manual_inspection_status,
            from: from,
            to: to,
            offset: offset,
            limit: limit
          };
          callback();
        }
      });
    }

    //总页数
    yield function(callback) {
      audioModel.getRowsCount(params, function(err, count) {
        if (err) {
          status = 400;
        } else {
          var totalPage = Math.ceil(count / limit);
          result.totalPage = totalPage;
          callback()
        }
      })
    }

    //系统列表
    var systemModel = this.model("system")
    yield function(callback) {
      systemModel.getRows({},function(err,row){
        if (err) {
          status = 400;
        } else {
          var systemList = row;
          result.systemList = systemList;
          callback()
        }
      })
    }

    result.title = "录音质检";

    result.sit_number = id;
    result.common = self.library("common");
    yield self.render('inspections/sit_inspect', result);
  });
  //申请复议
  $.put("/inspections/sit/:_id", function*(next) {
    var self = this;

    var _id = this.params._id;
    var _params = this.request.fields;

    var status = 201;
    var result = {};

    var audioModel = this.model('audio')
    yield function(callback) {
      audioModel.findOneAndUpdateRow({ _id: _id }, _params, function(err, row) {
        if (!err && row) {
          status = 200;
          result = row;
        } else {
          status = 400;
          result = "更新失败";
        }
        callback();
      });
    }

    this.status = status;
    this.body = result;
  })
  //标记为学习录音
  $.put("/inspections/mark", function*(next) {
    var self = this;
    //将session放入ejs渲染数据中
    self.state.session = self.session;

    //admin 或 manager 角色才可访问
    if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
      self.redirect('/login');
      return;
    }

    var status = 201;
    var result = {};
    var params = {};
    var _params = this.request.fields;

    var ids = _params;
    //是否标记为学习型录音；0：否；1：被标记为学习录音；
    params["marked_study"] = 1;


    var audioModel = this.model("audio");
    yield function(callback) {
      for(var i=0;i<ids.length;i++){
        audioModel.findOneAndUpdateRow({
          _id: ids[i]
        }, params, function(err, row) {
          if (!err && row) {
            result = {
              work: row
            };
            status = 201;
          } else {
            result = "更新失败!";
            status = 400;
          }
          callback();
        });
      }
    };

    this.status = status;
    this.body = result;
  });


  /**
  *@desc 该音频文件所属的系统是否设定人工质检分类
  *@param audioId
  *@author fanxd
  */
  $.get("/inspections/validate/:audioId",function*(next){
    var self = this;
    var audioId  = this.params.audioId;
    var status = 200;
    var result = {};
    //获取录音信息
    var audioModel = this.model('audio');
    var audio = {};
    yield function(callback) {
      audioModel.getRow({ _id: audioId }, function(err, row) {
        if (!err && row) {
          status = 200;
          audio = row;
        } else {
          status = 404;
        }
        callback();
      });
    }


    yield function(callback){
      var appModel = this.model("rule_score");
      appModel.getRowsCount({system:audio.system,rule_base:"人工质检评分规则库"},function(err,count){
        if(!err && count>0){
          result = {
            code : "20000",
            msg : "已设定"
          }
        }else{
          result = {
            code : "20002",
            msg : "未设定"
          }
        }
        callback();
      })
    }

    this.status = status;
    this.body = result;
  });

}
