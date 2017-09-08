module.exports = function($) {
  //坐席质检结果统计列表
  $.get("/analyses/agents", function*(next) {
    var self = this;

    //将session放入ejs渲染数据中
    self.state.session = self.session;

    //admin 或 manager 角色才可访问
    if (!self.session.user || self.session.user.role == 'worker') {
      self.redirect('/login');
      return;
    }
    var _params = this.request.query;
    var result = {};
    var params = {};

    if(self.session.user.role == 'chargeman'){
      params.qa_group = self.session.user.user_group;
    }
    if(self.session.user.role == 'omni'){
      params.sit_number = self.session.user.sit_number;
    }
    var offset = _params.offset ? _params.offset : 0;
    var limit = _params.limit ? _params.limit : config.get("limit");

    //坐席工号查询
    var sitNumber = _params["sit_number"] ? _params["sit_number"] : "";
    if (sitNumber === 'all') {
      sitNumber = ''
    }
    if (sitNumber !== '') {
      params.sit_number = 1;
    }
    //坐席组查询
    var sitTeam = _params["sit_team"] ? _params["sit_team"] : "";
    if (sitTeam !== '') {
      params.sit_team = sitTeam;
    }
    //渠道查询
    var channel = _params["channel"] ? _params["channel"] : "";
    if (channel !== '') {
      params.channel = channel;
    }
    //系统查询
    var system = _params["system"] ? _params["system"] : "";
    if (system === "all") {
      system = '';
    }
    if (system !== '') {
      params.system = system;
    }
    //标签类型查询(质检状态 0 未质检， 1 已质检)
    var labelType = _params["label_type"] ? _params["label_type"] : "";
    if (labelType === 'all') {
      labelType = ''
    }
    if (labelType !== '') {
      params.label_type = labelType
    }
    //复议状态查询(复议状态 0 未复议,1 已复议)
    var recheckStatus = _params["recheck_status"] ? _params["recheck_status"] : "";
    if (recheckStatus === 'all') {
      recheckStatus = ''
    }
    if (recheckStatus !== '') {
      params.recheck_status = Number(recheckStatus);
    }
    //呼叫时间查询
    var from = _params["from"] ? Number(_params["from"].trim()) : "";
    var to = _params["to"] ? Number(_params["to"].trim()) : "";

    if (from !== '' && to !== '') {
      params["call_time"] = { "$gte": from, "$lt": to };
      console.log(params)
    }
    //得分区间查询
    var startScore = _params["startScore"] ? _params["startScore"] : "";
    var endScore = _params["endScore"] ? _params["endScore"] : "";

    if (startScore !== '' && endScore !== '') {
      params["score"] = { "$gte": startScore, "$lt": endScore };
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
            sit_number: sitNumber,
            sit_team: sitTeam,
            channel: channel,
            system: system,
            label_type: labelType,
            recheck_status: recheckStatus,
            from: from,
            to: to,
            startScore: startScore,
            endScore: endScore,
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
    //坐席列表
    var userModel = this.model("user")
    yield function(callback) {
      userModel.getRows({'role':'omni'},function(err,row){
        if (err) {
          status = 400;
        } else {
          var sitList = row;
          result.sitList = sitList;
          callback()
        }
      })
    }
    result.title = '坐席质检结果统计';

    var common = self.library("common");
    result.common = common;
    yield self.render('analyses/agents', result);
  })
  // 坐席质检结果统计下载列表
  $.get("/analyses/agents/download", function*(next) {
    var self = this;

    //将session放入ejs渲染数据中
    self.state.session = self.session;

    var _params = this.request.query;
    var params = {};
    var result = {};
    var status = 200;
    // 保存的文件下载路径
    if(self.session.user.role == 'omni'){
      params.sit_number = self.session.user.sit_number;
    }
    var fileName = "坐席质检统计_"+new Date().format("yyyyMMddhhmm")+".csv";
    var csvfile = "";
    var osType = _params["os_type"] ? _params["os_type"] : "";
    var iconv = require('iconv-lite');

    //坐席工号查询
    var sitNumber = _params["sit_number"] ? _params["sit_number"] : "";
    if (sitNumber === 'all') {
      sitNumber = ''
    }
    if (sitNumber !== '') {
      params.sit_number = sitNumber;
    }
    //坐席组查询
    var sitTeam = _params["sit_team"] ? _params["sit_team"] : "";
    if (sitTeam !== '') {
      params.sit_team = sitTeam;
    }
    //渠道查询
    var channel = _params["channel"] ? _params["channel"] : "";
    if (channel !== '') {
      params.channel = channel;
    }
    //系统查询
    var system = _params["system"] ? _params["system"] : "";
    if (system === "all") {
      system = '';
    }
    if (system !== '') {
      params.system = system;
    }
    //标签类型查询(质检状态 0 未质检， 1 已质检)
    var labelType = _params["label_type"] ? _params["label_type"] : "";
    if (labelType === 'all') {
      labelType = ''
    }
    if (labelType !== '') {
      params.label_type = labelType
    }
    //复议状态查询(复议状态 0 未复议,1 已复议)
    var recheckStatus = _params["recheck_status"] ? _params["recheck_status"] : "";
    if (recheckStatus === 'all') {
      recheckStatus = ''
    }
    if (recheckStatus !== '') {
      params.recheck_status = recheckStatus;
    }
    //呼叫时间查询
    var startTime = _params["from"] ? Number(_params["from"].trim()) : "";
    var endTime = _params["to"] ? Number(_params["to"].trim()) : "";

    if (startTime !== '' && endTime !== '') {
      params["call_time"] = { "$gte": startTime, "$lt": endTime };
    }
    //得分区间查询
    var startScore = _params["startScore"] ? _params["startScore"] : "";
    var endScore = _params["endScore"] ? _params["endScore"] : "";

    if (startScore !== '' && endScore !== '') {
      params["score"] = { "$gte": startScore, "$lt": endScore };
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
              坐席工号:row.sit_number,
              坐席组:row.sit_team,
              所属业务:row.system_name,
              所属渠道:row.channel,
              人工得分:row.person_score,
              智能得分:row.machine_score,
              总分:row.score,
              人工扣分原因:row.decrease_reason,
              标签类型:row.label_type,
              标签细则:row.label_details,
              来电时间:row.call_time_format
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
  //质检员工作统计列表
  $.get("/analyses/workers", function*(next) {
    var self = this;
    //将session放入ejs渲染数据中
    self.state.session = self.session;

    //admin 或 manager 角色才可访问
    if (!self.session.user || self.session.user.role == 'omni' ) {
      self.redirect('/login');
      return;
    }
    var _params = this.request.query;
    var result = {};
    var params = {};

    if(self.session.user.role == 'chargeman'){
      params.qa_group = self.session.user.user_group;
    }

    if(self.session.user.role == 'worker'){
      params.qa_person = self.session.user._id;
    }else{
      //质检员查询
      var assignTo = _params["assign_to"] ? _params["assign_to"] : "";
      if (assignTo === "all") {
        assignTo = ''
      }
      if (assignTo !== '') {
        params.qa_person = assignTo;
      }
    }

    var offset = _params.offset ? _params.offset : 0;
    var limit = _params.limit ? _params.limit : config.get("limit");


    // //渠道查询
    // var channel = _params["channel"] ? _params["channel"] : "";
    // if (channel != '') {
    //   params.channel = _params["channel"];
    // }
    //系统查询
    var system = _params["system"] ? _params["system"] : "";
    if (system === "all") {
      system = '';
    }
    if (system !== '') {
      params.system = _params["system"];
    }
    //录音状态查询
    var audioStatus = _params["upload_audio_status"] ? _params["upload_audio_status"] : "";
    if (audioStatus === "all") {
      audioStatus = ''
    }
    if (audioStatus !== '') {
      params.upload_audio = {
        'upload_audio_status':Number(audioStatus.trim())
      }
    }
    //标签类型查询
    var labelType = _params["label_type"] ? _params["label_type"] : "";
    if (labelType === "all") {
      labelType = ''
    }
    if (labelType !== '') {
      params.label_type = Number(labelType.trim());
    }
    //复议状态查询(复议状态 0 未复议,1 已复议)
    var recheckStatus = _params["recheck_status"] ? _params["recheck_status"] : "";
    if (recheckStatus === "all") {
      recheckStatus = ''
    }
    if (recheckStatus !== '') {
      params.recheck_status = Number(recheckStatus.trim());
    }
    //呼叫时间查询
    var from = _params["from"] ? Number(_params["from"].trim()) : "";
    var to = _params["to"] ? Number(_params["to"].trim()) : "";

    if (from !== '' && to !== '') {
      params["call_time"] = { "$gte": from, "$lt": to };
    }
    //得分区间查询
    var startScore = _params["startScore"] ? _params["startScore"] : "";
    var endScore = _params["endScore"] ? _params["endScore"] : "";

    if (startScore !== '' && endScore !== '') {
      params["score"] = { "$gte": Number(startScore.trim()), "$lt": Number(endScore.trim()) };
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
            assign_to: assignTo,
            upload_audio_status: audioStatus,
            system: system,
            label_type: labelType,
            recheck_status: recheckStatus,
            from: from,
            to: to,
            startScore: startScore,
            endScore: endScore,
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
        }
        callback()
      })
    }

    //系统列表
    var systemModel = this.model("system")
    yield function(callback) {
      systemModel.getRows({}, function(err, sys) {
        if (err) {
          status = 400;
        } else {
          result.systemList = sys;
        }
        callback()
      })
    }

    //质检员列表
    var userModel = this.model("user")
    yield function(callback) {
      userModel.getRows({'role':'worker'},function(err,row){
        if (err) {
          status = 400;
        } else {
          result.workerList = row;
          callback()
        }
      })
    }

    result.title = '质检员工作统计';

    var common = self.library("common");
    result.common = common;
    yield self.render('analyses/workers', result);
  })


  // 质检员工作统计下载列表
  $.get("/analyses/workers/download", function*(next) {
    var self = this;

    var _params = this.request.query;
    var params = {};
    var result = {};
    var status = 200;
    // 保存的文件下载路径
    var fileName = "质检员工作统计_"+new Date().format("yyyyMMddhhmm")+".csv";
    var csvfile = "";
    var osType = _params["os_type"] ? _params["os_type"] : "";
    var iconv = require('iconv-lite');

    if(self.session.user.role == 'chargeman'){
      params.qa_group = self.session.user.user_group;
    }

    if(self.session.user.role == 'worker'){
      params.qa_person = self.session.user._id;
    }else{
      //质检员查询
      var assignTo = _params["assign_to"] ? _params["assign_to"] : "";
      if (assignTo === "all") {
        assignTo = ''
      }
      if (assignTo !== '') {
        params.qa_person = assignTo;
      }
    }
    // //渠道查询
    // var channel = _params["channel"] ? _params["channel"] : "";
    // if (channel != '') {
    //   params.channel = channel;
    // }
    //系统查询
    var system = _params["system"] ? _params["system"] : "";
    if (system === "all") {
      system = '';
    }
    if (system !== '') {
      params.system = system;
    }
    //录音状态查询
    var audioStatus = _params["audio_status"] ? _params["audio_status"] : "";
    if (audioStatus === "all") {
      audioStatus = ''
    }
    if (audioStatus !== '') {
      params.upload_audio = {
        "upload_audio_status":Number(audioStatus.trim())
      }
    }
    //标签类型查询
    var labelType = _params["label_type"] ? _params["label_type"] : "";
    if (labelType === "all") {
      labelType = ''
    }
    if (labelType !== '') {
      params.label_type = Number(labelType.trim());
    }
    //复议状态查询(复议状态 0 未复议,1 已复议)
    var recheckStatus = _params["recheck_status"] ? _params["recheck_status"] : "";
    if (recheckStatus === "all") {
      recheckStatus = ''
    }
    if (recheckStatus !== '') {
      params.recheck_status = Number(recheck_status.trim());
    }
    //呼叫时间查询
    var startTime = _params["from"] ? Number(_params["from"].trim()) : "";
    var endTime = _params["to"] ? Number(_params["to"].trim()) : "";

    if (startTime !== '' && endTime !== '') {
      params["call_time"] = { "$gte": startTime, "$lt": endTime };
    }
    //得分区间查询
    var startScore = _params["startScore"] ? _params["startScore"] : "";
    var endScore = _params["endScore"] ? _params["endScore"] : "";

    if (startScore !== '' && endScore !== '') {
      params["score"] = { "$gte": Number(startScore.trim()), "$lt": Number(endScore.trim()) };
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
              质检员:row.assign_to,
              所属业务:row.system_name,
              // 所属渠道:row.channel,
              录音状态:row.audioStatus,
              人工得分:row.person_score,
              智能得分:row.machine_score,
              总分:row.score,
              人工扣分原因:row.decrease_reason,
              标签类型:row.label_type,
              标签细则:row.label_details,
              来电时间:row.call_time_format
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
            if(rows[i].audio_status.manual_inspection_status == 0){
              rows[i].audioStatus = "未质检";
            }
            if(rows[i].audio_status.manual_inspection_status == 1){
              rows[i].audioStatus = "已质检";
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


  $.get("/analyses/ai_result", function*(next) {

    var self = this;
    var _params = this.request.query;
    var result = {};
    var params = {};

    var offset = _params.offset ? _params.offset : 0;
    var limit = _params.limit ? _params.limit : config.get("limit");
    //渠道查询
    var channel = _params["channel"] ? _params["channel"] : "";
    if (channel != '') {
      params.channel = _params["channel"];
    }
    //标签类型查询
    var labelType = _params["labelType"] ? _params["labelType"] : "";
    if (labelType != '') {
      params.label_type = Number(_params["labelType"].trim());
    }
    //呼叫时间查询
    var startTime = _params["startTime"] ? _params["startTime"] : "";
    var endTime = _params["endTime"] ? _params["endTime"] : "";

    if (startTime != '' && endTime != '') {
      params["call_time"] = { "$gte": startTime, "$lt": endTime };
    }
    var audioModel = this.model("audio");
    yield function(callback) {
      audioModel.getRowsCount(params, function(err, count) {
        totalPage = Math.ceil(count / limit);
        audioModel.getPagedRows(params, offset, limit, {
          created: -1
        }, function(err, rows) {
          if (err) {
            status = 400;
          } else {
            result = {
              rows: rows,
              channel: channel,
              labelType: labelType,
              startTime: startTime,
              endTime: endTime,
              offset: offset,
              limit: limit,
              totalPage: totalPage
            };
          }
          callback();
        });
      });
    }
    result.title = '智能客服质检结果';

    yield self.render('qa/qa_ai_result', result);
  })

}
