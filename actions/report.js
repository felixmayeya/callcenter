module.exports = function($) {
  //质检结果统计报表
  $.get("/inspections/repoInfo", function*(next) {
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

    //坐席工号查询
    var sitNumber = _params["sit_number"] ? _params["sit_number"] : "";
    if (sitNumber === 'all') {
      sitNumber = ''
    }
    //质检组
    var qa_group = _params["qa_group"] ? _params["qa_group"] : "";
    if (qa_group === 'all') {
      qa_group = ''
    }
    //所属业务
    var system = _params["system"] ? _params["system"] : "";
    if (system === "all") {
      system = '';
    }
    var from = _params["from"] ? Number(_params["from"].trim()) : "";
    var to = _params["to"] ? Number(_params["to"].trim()) : "";

    var timeDiffType = require("../libraries/time_diff_type");
    var dateType = timeDiffType(new Date(from),new Date(to),"YYYY-MM-DD HH:mm:ss");
    if(from == ''){
      dateType = "hour" ;
    }

    if(from != ''){
      params.call_time = {$gte: from, $lt: to};
    }
    if(sitNumber!=''){
      params.sit_number = sitNumber;//{$eq:sitNumber};
    }
    if(system!=''){
      params.system = system;//{$eq:system};
    }
    if(qa_group!=''){
      params.qa_group = qa_group;//{$eq:qa_group};
    }
    //params["audio_status.manual_inspection_status"] = {$eq:1};
    params["audio_status.auto_inspection_status"] = 1;
    params["audio_status.manual_inspection_status"] = 1;


    // var dateGroup = function(dt){
    // //  console.log(dt+"====")
    //   var key = "";
    //   if(dateType == "hour"){
    //     key = ""+dt.getFullYear()+"-"+(dt.getMonth()+1)+"-"+dt.getDate()+" "+dt.getHours();
    //     // console.log("========================")
    //   }
    //   if(dateType == "day"){
    //     key = ""+dt.getFullYear()+"-"+(dt.getMonth()+1)+"-"+dt.getDate();
    //   }
    //   if(dateType == "month"){
    //     key = ""+dt.getFullYear()+"-"+(dt.getMonth()+1);
    //   }
    //   if(dateType == "year"){
    //     key = ""+dt.getFullYear();
    //   }
    //   return key;
    // }

    var o = {
      map: function() {
        //  var dt = new Date(this.qa_completed_date);
        var dt = new Date(this.call_time);
        //var key = ""+dt.getFullYear()+"-"+(dt.getMonth()+1)+"-"+dt.getDate()+" "+dt.getHours();
        var key = ""+dt.getFullYear()+"-"+(dt.getMonth()+1)+"-"+dt.getDate();

        // console.log("========================");

        emit(key+"-"+this.system,
        {
          person_score:this.person_score,
          machine_score:this.machine_score,
          day:key,
          system:this.system
        });
      },
      reduce: function(key, values) {
        var obj = {};
        var machine_score = [];
        var person_score = [];
        for(var i = 0; i < values.length; i++){
          var v = values[i];
          person_score.push(v.person_score);
          machine_score.push(v.machine_score);
          obj.day=v.day,
          obj.system=v.system
        }
        obj.person_score=Array.avg(person_score).toFixed(2)
        obj.machine_score=Array.avg(machine_score).toFixed(2)
        return obj;
      },
      out : { inline : 1 },
      query: params
    }

    var audioModel = this.model("audio");
    yield function(callback) {
      audioModel.mapReduceRow(o, function(err, rows) {

        if (err) {
          status = 400;
        } else {
          result.rows=[];
          for(var i in rows){
            result.rows.push(rows[i]['value'])
          }
          callback();
        }
      });
    }

    var userModel=this.model("user");
    yield function(callback) {
      userModel.getColumnRows({'role':'omni'},{sit_number:1,username:1},function(err,row){
        if (!err && row) {
          result.userList=row;
        }
        callback();
      })
    }

    var userGroupModel=this.model("user_group");
    yield function(callback) {
      userGroupModel.getColumnRows({'type':'worker'},{name:1},function(err,rows){
        if (!err && rows) {
          result.groupList=rows;
        }
        callback();
      })
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

    result.from = from;
    result.to = to;
    result.qa_group =  qa_group;
    result.system = system;
    result.sit_number = sitNumber;
    result.operator = self.session.user.username;
    result.title =  '质检结果统计报表';

    var common = self.library("common");
    result.common = common;
    yield self.render('/charts/composite_score', result);
  });


  //质检任务报表
  $.get("/charts/quality_task", function*(next) {
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

    //质检组
    var qa_group = _params["qa_group"] ? _params["qa_group"] : "";
    if (qa_group === 'all') {
      qa_group = ''
    }
    //业务组
    var system = _params["system"] ? _params["system"] : "";
    if (system === "all") {
      system = '';
    }
    var from = _params["from"] ? Number(_params["from"].trim()) : "";
    var to = _params["to"] ? Number(_params["to"].trim()) : "";

    if(from != ''){
      params.call_time = {$gte: from, $lt: to};
    }
    if(qa_group!=''){
      params.qa_group = {$eq:qa_group};
    }
    if(system!=''){
      params.system = {$eq:system};
    }

    var o={
      map:function () {
        var dt = new Date(this.call_time);
        var key = ""+dt.getFullYear()+"-"+(dt.getMonth()+1)+"-"+dt.getDate();
        emit(key+"-"+this.system,
        {
          count:1,
          system:this.system,
          date:key,
          call_time:this.call_time
        });
      },
      reduce:function (key, values) {
        var obj = {};
        var count=0;
        for(var i = 0; i < values.length; i++){
          var v = values[i];
          count+=v.count,
          obj.system=v.system,
          obj.date=v.date,
          obj.call_time = v.call_time
        }
        obj.count=count;
        return obj;
      },
      out: { inline: 1 },
      query:params
    }

    var systemModel = this.model("system")
    var systemMap={};
    var systenNames=[];
    yield function(callback) {
      systemModel.getRows({}, function(err, sys) {
        if (err) {
          status = 400;
        } else {
          sys.forEach(function(obj){
            systemMap[obj._id]=obj.name;
            systenNames.push(obj.name);
          })
        }
        callback()
      })
    }
    //系统列表
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

    var _lodash = require('lodash');
    result.systenNames=systenNames;
    var audioModel = this.model("audio");
    yield function(callback) {
      audioModel.mapReduceRow(o, function(err, rows) {
        if (err) {
          status = 400;
        } else {
          rows = _lodash.orderBy(rows, ['value.call_time'],['asc']);

          result.rows=[];
          var dateMap = {};
          for(var i in rows){

            var date = rows[i]['value']['date'];
            var system = rows[i]['value']['system'];
            var count = rows[i]['value']['count'];
            var systemName = systemMap[system];

            // if(dateMap[date]){
            //   dateMap[date].push({
            //     name : systemName,
            //     count : count
            //   });
            // }else{
            //   var data=[];
            //   data.push({
            //     name : systemName,
            //     count : count
            //   });
            //   dateMap[date] = data;
            // }

            if(dateMap[date]){
              var dateMapDate = {};
              for(var n=0;n<dateMap[date].length;n++){
                var obj = dateMap[date][n];
                dateMapDate[obj.name] = obj.count;
              }
              dateMapDate[systemName] = Number(dateMapDate[systemName])+count;
              dateMap[date] = [];
              for(i in dateMapDate){
                dateMap[date].push({
                  name:i,
                  count:dateMapDate[i]
                });
              }
            }else{
              var data=[];
              for(var k=0;k<systenNames.length;k++){
                var num = 0;
                var sysName = systenNames[k];
                if(systemName == sysName){
                  num = count;
                }
                data.push({
                  name : sysName,
                  count: num
                });
              }
              dateMap[date] = data;
            }

          }

          // dateMap = _lodash.orderBy(dateMap, ['date'],['asc']);

          for(i in dateMap){
            result.rows.push({
              date: i,
              data:dateMap[i]
            })
          }

//         result.rows = _lodash.orderBy(result.rows, ['date'],['asc']);
// console.log(result.rows);
// result.rows = _lodash.sortBy(result.rows, [function(o) { return new Date(o.date).getTime; }]);
//  console.log(result.rows);
          callback();
        }
      });
    }

    //质检组
    var userGroupModel=this.model("user_group");
    yield function(callback) {
      userGroupModel.getColumnRows({'type':'worker'},{name:1},function(err,rows){
        if (!err && rows) {
          result.groupList=rows;
        }
        callback();
      })
    }



    result.from = from;
    result.to = to;
    result.qa_group =  qa_group;
    result.system = system;

    result.operator = self.session.username;
    result.title =  '质检任务分析报表';
    var common = self.library("common");
    result.common = common;
    yield self.render('/charts/quality_task', result);
  });



  //质检员质检进度分析
  $.get("/report/qa_analysis", function*(next){
    var self = this;

    //将session放入ejs渲染数据中
    self.state.session = self.session;

    //admin 或 manager 角色才可访问
    if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
      self.redirect('/login');
      return;
    }
    var _params = this.request.query;
    var result = {};

    var audioModel = this.model("audio");


    var from = _params["from"]?_params["from"] : "";
    var to = _params["to"]?_params["to"] : "";
    var system =  _params["system"]  && _params["system"] !="all" ? _params["system"] : "";
    var qa_group = _params["qa_group"] && _params["qa_group"] !="all" ?_params["qa_group"] : "";

    var userParams = {};
    userParams.role = "worker";
    if(qa_group!=''){
      userParams.user_group = qa_group;
    }
    var rowList = {};
    var userModel=this.model("user");
    yield function(callback) {
      userModel.getColumnRows(userParams,{username:1},function(err,row){
        if (!err && row) {
          rowList = row;
        }
        callback();
      })
    }

    //获取到所有质检员信息
    var qa_processlist = [];
    for(var x = 0; x < rowList.length; x++){
      var num1 = 0;
      var num2 = 0;
      var num3 = 0;

      var audio_params = {};
      if( "" != from && from !='' &&  "" != to && to !=''){
        audio_params["start_date"] = { "$gte": from};
        audio_params["completed_date"] = { "$lt": to};
      }
      if( "" != system ){
        audio_params["system"] = system;
      }
      // if( "" != qa_group ){
      //   audio_params["qa_group"] = qa_group;
      // }

      //未质检
      yield function(callback1) {
        audio_params["audio_status.manual_inspection_status"] = 0;
        audio_params.qa_person = rowList[x]._id;
        audioModel.getRowsCount(audio_params, function(err2, count1) {
          if (!err2) {
            num1 = count1;
          }
          callback1();
        })
      }
      //已质检
      yield function(callback2) {
        audio_params["audio_status.manual_inspection_status"] = 1;
        audio_params.qa_person = rowList[x]._id;
        audioModel.getRowsCount(audio_params, function(err3, count2) {
          if (!err3) {
            num2 = count2;
          }
          callback2();
        })
      }
      //预期未质检
      yield function(callback3) {
        audio_params["audio_status.manual_inspection_status"] = 0;
        audio_params.qa_person = rowList[x]._id;
        audio_params["completed_date"] = {"$lt": Number(Date.parse(new Date()))};
        audioModel.getRowsCount(audio_params, function(err4, count3) {
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
        nonqa_number  : parseInt(num1-num3),
        overdue_number: parseInt(num3),
        qa_process    : qa_pro
      });

    }

    //质检组
    var userGroupModel=this.model("user_group");
    yield function(callback) {
      userGroupModel.getColumnRows({'type':'worker'},{name:1},function(err,rows){
        if (!err && rows) {
          result.groupList=rows;
        }
        callback();
      })
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

    result.from = from;
    result.to = to;
    result.qa_group =  qa_group;
    result.system = system;

    result.qa_processlist = qa_processlist;
    result.operator = self.session.username;
    result.title =  '质检员质检进度分析';

    var common = self.library("common");
    result.common = common;
    yield self.render('/charts/qc_performance', result);
  });

  //质检任务报表
  $.get("/charts/illegal_proportion", function*(next) {
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
    var result = [];
    var status = 200;

    var from = _params["from"] ? Number(_params["from"].trim()) : "";
    var to = _params["to"] ? Number(_params["to"].trim()) : "";

    // if( "" != from && from !='' &&  "" != to && to !=''){
    //   params["call_time"] = { "$gte": from};
    //   params["call_time"] = { "$lt": to};
    // }
    if(from != ''){
      params.call_time = {$gte: from, $lt: to};
    }
    //坐席工号查询
    var sitNumber = _params["sit_number"] ? _params["sit_number"] : "";
    if (sitNumber === 'all') {
      sitNumber = ''
    }
    if (sitNumber !== '') {
      params.sit_number = 1;
    }
    //系统查询
    var system = _params["system"] ? _params["system"] : "";
    if (system === "all") {
      system = '';
    }
    if (system !== '') {
      params.system = system;
    }
    //  db.getCollection('audios').find({},{_id:0, "machine_result":1})
    var strArr=[];
    var audioModel = this.model("audio");
    yield function(callback) {
      audioModel.getColumnRows(params,{"_id":0,"machine_result":1},function(err, rows) {
        if (err) {
          status = 400;
        } else {
          for(var i in rows){
            strArr = strArr.concat(rows[i]['machine_result']);
          }
          callback();
        }
      });
    }
    var common = self.library("common");
    common.clearArray(strArr);
    var objects = [];
    strArr.forEach(function(obj){
      if(objects[obj.rule_name]){
        objects[obj.rule_name]++;
      }else{
        objects[obj.rule_name] = 1;
      }
    })
    result.rows=[];
    for(var i in objects){
      var obj ={
        "rule_name":i,
        "count":objects[i]
      }
      result.rows.push(obj)
    }

    // 座席
    var userModel=this.model("user");
    yield function(callback) {
      userModel.getColumnRows({'role':'omni'},{sit_number:1,username:1},function(err,row){
        if (!err && row) {
          result.userList=row;
        }
        callback();
      })
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

    result.from = from;
    result.to = to;
    result.sit_number =  sitNumber;
    result.system = system;

    result.operator = self.session.username;
    result.title =  '违规占比分析报表';


    result.common = common;
    yield self.render('/charts/illegal_proportion', result);
  });


  //静音时长报表
  $.get("/charts/quiet_time", function*(next) {
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

    var from = _params["from"] ? Number(_params["from"].trim()) : "";
    var to = _params["to"] ? Number(_params["to"].trim()) : "";
    var mute_type = _params["mute_type"]?_params["mute_type"]:"0";


    if(from != ''){
      params.call_time = {$gte: from, $lt: to};
    }
    var muteType=this.model("mute_type");
    var muteTypes={};
    yield function(callback) {
      muteType.getRows({},function(err,rows){
        if (err) {
          status = 400;
        } else {
          muteTypes = rows;
        }
        callback();
      })
    }

    var audioModel=this.model("audio");
    var data = [] ;
    for(var i=0;i<muteTypes.length;i++){

      var lower = muteTypes[i].lower !='' ?(muteTypes[i].lower)*1000 : 0;
      var upper = muteTypes[i].upper !='' ?(muteTypes[i].upper)*1000 : 0;

      //总静音时长
      if(mute_type === "0"){
        if(upper == 0){
          params.mute_duration = {$gte: lower}
        }else{
          params.mute_duration = {$gte: lower, $lt: upper}
        }
      }
      //客户静音总时长
      if(mute_type === "1"){
        if(upper == 0){
          params.customer_mute_time = {$gte: lower}
        }else{
          params.customer_mute_time = {$gte: lower, $lt: upper}
        }
      }
      //座席静音总时长
      if(mute_type === "2"){
        if(upper == 0){
          params.omni_mute_time = {$gte: lower}
        }else{
          params.omni_mute_time = {$gte: lower, $lt: upper}
        }
      }

      var totalPage = {};
      yield function(callback) {
        audioModel.getRowsCount(params, function(err, count) {
          if(!err){
            totalPage = count;
          }
          callback();
        });
      }
      var lowers = muteTypes[i].lower != '' ? muteTypes[i].lower : '*';
      var uppers = muteTypes[i].upper != '' ? muteTypes[i].upper : '*';
      data.push({
        name : muteTypes[i].name+'('+lowers+'~'+uppers+'秒)',
        count : totalPage
      });
    }

    result.data = data;
    result.from = from;
    result.to = to;
    result.mute_type = mute_type;
    result.title =  '分析报表-静音时长';
    var common = self.library("common");
    result.common = common;
    this.body=result
    yield self.render('/charts/quiet_time', result);
  });


  /**
  *@desc 静音时长报表
  *@param from 呼叫开始时间
  *@param to 呼叫结束时间
  *@param mute_type 静音分析对象
  *@param mute_name 静音分类名称
  *@author fanxd
  *@return 返回静音分类的列表
  */
  $.get("/charts/quiet_time/list", function*(next) {
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

    var from = _params["from"] ? Number(_params["from"].trim()) : "";
    var to = _params["to"] ? Number(_params["to"].trim()) : "";
    var mute_type = _params["mute_type"]?_params["mute_type"]:"0";
    var mute_name = _params["mute_name"]?_params["mute_name"]:"";

    if(mute_name==''){
      this.status = status;
      this.body={
        code : "20001",
        msg :"静音分类名称不能为空！"
      };
      return;
    }

    var muteType={};
    var muteTypeModel=this.model("mute_type");
    yield function(callback) {
      muteTypeModel.getColumnRow({name:mute_name},{lower:1,upper:1},function(err,row){
        if (err) {
          status = 400;
        } else {
          muteType = row;
        }
        callback();
      })
    }

    if(from != ''){
      params.call_time = {$gte: from, $lt: to};
    }

    var lower = muteType.lower !='' ?(muteType.lower)*1000 : 0;
    var upper = muteType.upper !='' ?(muteType.upper)*1000 : 0;

    //总静音时长
    if(mute_type === "0"){
      if(upper == 0){
        params.mute_duration = {$gte: lower}
      }else{
        params.mute_duration = {$gte: lower, $lt: upper}
      }
    }
    //客户静音总时长
    if(mute_type === "1"){
      if(upper == 0){
        params.customer_mute_time = {$gte: lower}
      }else{
        params.customer_mute_time = {$gte: lower, $lt: upper}
      }
    }
    //座席静音总时长
    if(mute_type === "2"){
      if(upper == 0){
        params.omni_mute_time = {$gte: lower}
      }else{
        params.omni_mute_time = {$gte: lower, $lt: upper}
      }
    }

    var audioModel=this.model("audio");
    yield function(callback) {
      audioModel.getColumnRows(params,{ seq:1,mute_duration:1,mute_ratio:1,customer_mute_time:1,customer_mute_ratio:1,omni_mute_time:1,omni_mute_ratio:1,call_time:1}, function(err, rows) {
        if(!err && rows){
          result = rows;
        }
        callback();
      });
    }

    this.status = status;
    this.body=result;
  });


  //平均语速分析报表
  $.get("/charts/speech_rate", function*(next) {
    var self = this;
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

    var from = _params["from"] ? Number(_params["from"].trim()) : "";
    var to = _params["to"] ? Number(_params["to"].trim()) : "";
    var speed_type = _params["speed_type"]?_params["speed_type"]:"0";


    if(from != ''){
      params.call_time = {$gte: from, $lt: to};
    }
    var speedType=this.model("speed_type");
    var speedTypes={};
    yield function(callback) {
      speedType.getRows({},function(err,rows){
        if (err) {
          status = 400;
        } else {
          speedTypes = rows;
        }
        callback();
      })
    }

    var audioModel=this.model("audio");
    var data = [] ;
    for(var i=0;i<speedTypes.length;i++){

      var lower = speedTypes[i].lower !='' ?(speedTypes[i].lower) : 0;
      var upper = speedTypes[i].upper !='' ?(speedTypes[i].upper) : 0;

      //总语速
      if(speed_type === "0"){
        if(upper == 0){
          params.speed = {$gte: lower}
        }else{
          params.speed = {$gte: lower, $lt: upper}
        }
      }
      //用户语速
      if(speed_type === "1"){
        if(upper == 0){
          params.customer_speed = {$gte: lower}
        }else{
          params.customer_speed = {$gte: lower, $lt: upper}
        }
      }
      //坐席语速
      if(speed_type === "2"){
        if(upper == 0){
          params.agent_speed = {$gte: lower}
        }else{
          params.agent_speed = {$gte: lower, $lt: upper}
        }
      }

      var totalPage = {};
      yield function(callback) {
        audioModel.getRowsCount(params, function(err, count) {
          if(!err){
            totalPage = count;
          }
          callback();
        });
      }

      var lowers = speedTypes[i].lower != '' ? speedTypes[i].lower : '*';
      var uppers = speedTypes[i].upper != '' ? speedTypes[i].upper : '*';
      data.push({
        name : speedTypes[i].name+'('+lowers+'~'+uppers+'字/秒)',
        count : totalPage
      });
    }

    result.data = data;
    result.from = from;
    result.to = to;
    result.speed_type = speed_type;
    result.title =  '分析报表-平均语速';
    var common = self.library("common");
    result.common = common;
    this.body=result
    yield self.render('/charts/speech_rate', result);
  });

  /**
  *@desc 根据语速类型查询平均语速信息
  *@param from 呼叫开始时间
  *@param to 呼叫结束时间
  *@param speed_type 语速分析对象
  *@param speed_name 语速分类名称
  *@author fanxd
  *@return 返回语速分类的列表
  */
  $.get("/charts/speech_rate/list", function*(next) {
    var self = this;
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

    var from = _params["from"] ? Number(_params["from"].trim()) : "";
    var to = _params["to"] ? Number(_params["to"].trim()) : "";
    var speed_type = _params["speed_type"] ?_params["speed_type"]:"0";
    var speed_name = _params["speed_name"]?_params["speed_name"]:"";
    console.log(speed_name);
    if(speed_name == ''){
      this.status = status;
      this.body={
        code : "20001",
        msg : "语速分类名称不能为空！"
      };
      return;
    }

    if(from != ''){
      params.call_time = {$gte: from, $lt: to};
    }
    var speedTypeModel=this.model("speed_type");
    var speedType={};
    yield function(callback) {
      speedTypeModel.getColumnRow({name:speed_name},{lower:1,upper:1},function(err,row){
        if (err) {
          status = 400;
        } else {
          speedType = row;
        }
        callback();
      })
    }
console.log(speedType);

    var lower = speedType.lower !='' ? (speedType.lower) : 0;
    var upper = speedType.upper !='' ? (speedType.upper) : 0;

    //总语速
    if(speed_type === "0"){
      if(upper == 0){
        params.speed = {$gte: lower}
      }else{
        params.speed = {$gte: lower, $lt: upper}
      }
    }
    //用户语速
    if(speed_type === "1"){
      if(upper == 0){
        params.customer_speed = {$gte: lower}
      }else{
        params.customer_speed = {$gte: lower, $lt: upper}
      }
    }
    //坐席语速
    if(speed_type === "2"){
      if(upper == 0){
        params.agent_speed = {$gte: lower}
      }else{
        params.agent_speed = {$gte: lower, $lt: upper}
      }
    }

    var audioModel=this.model("audio");
    yield function(callback) {
      audioModel.getColumnRows(params,{seq:1,call_time:1,speed:1,customer_speed:1,agent_speed:1}, function(err, rows) {
        if(!err){
          result = rows;
        }
        callback();
      });
    }

    this.status = status;
    this.body=result;
  });

  /**
  *@desc 情绪分析报表
  *@param from 开始时间
  *@param to  结束时间
  *@param emotion_type 情绪质检对象 0 全部  1 坐席  2客户
  *@author bcl
  */
  $.get("/charts/emotion", function*(next) {
    var self = this;
    self.state.session = self.session;
    //admin 或 manager 角色才可访问
    if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
      self.redirect('/login');
      return;
    }
    var _params = this.request.query;
    var result = {};
    var params ={};
    var status = 200;
    var condition={};
    var from = _params["from"] ? Number(_params["from"].trim()) : "";
    var to = _params["to"] ? Number(_params["to"].trim()) : "";
    var emotion_type = _params["emotion_type"]?_params["emotion_type"]:"0";
    if(from != ''){
      params.call_time = {$gte: from, $lt: to};
    }

    if(emotion_type === '0'){
      condition = {
        _id:0,
        condition:1,
        emotion_json:1
      }
    }
    if(emotion_type === '1'){
      condition = {
        _id:0,
        condition:1,
        omni_emotion_json:1
      }
    }
    if(emotion_type === '2'){
      condition = {
        _id:0,
        condition:1,
        customer_emotion_json:1
      }
    }

    var audioModel=this.model("audio");
    var emotionJson = [];
    yield function(callback) {
      audioModel.getColumnRows(params, condition,function(err, rows) {
        if(!err){
          for(i in rows){
            if(rows[i].emotion_json !=''){
              if(emotion_type === '0'){
                emotionJson = emotionJson.concat(rows[i].emotion_json)
              }
              if(emotion_type === '1'){
                emotionJson = emotionJson.concat(rows[i].omni_emotion_json)
              }
              if(emotion_type === '2'){
                emotionJson = emotionJson.concat(rows[i].customer_emotion_json)
              }
            }
          }
        }
        callback();
      });
    }

    var common = self.library("common");
    common.clearArray(emotionJson);
    var objects = [];
    emotionJson.forEach(function(obj){
      if(objects[obj.emotion_type]){
        objects[obj.emotion_type]++;
      }else{
        objects[obj.emotion_type] = 1;
      }
    })
    result.data=[];
    for(var i in objects){
      var obj ={
        "emotion_type":i,
        "count":objects[i]
      }
      result.data.push(obj)
    }
    result.title="分析报表-情绪分析";
    result.from = from;
    result.to = to;
    result.emotion_type = emotion_type;
    var common = self.library("common");
    result.common = common;
    yield self.render('/charts/emotion', result);
  });

  /**
  *@desc 来电时间分析报表
  *@param from 开始时间
  *@param to  结束时间
  *@author bcl
  */
  $.get("/charts/call_time", function*(next) {
    var self = this;
    self.state.session = self.session;
    //admin 或 manager 角色才可访问
    if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
      self.redirect('/login');
      return;
    }
    var _params = this.request.query;
    var result = {};
    var params ={};
    var status = 200;
    var condition={};
    var from = _params["from"] ? Number(_params["from"].trim()) : "";
    var to = _params["to"] ? Number(_params["to"].trim()) : "";
    if(from != ''){
      params.call_time = {$gte: from, $lt: to};
    }
    var o = {
      map: function() {
        var dt = new Date(this.call_time);
        var key = ""+dt.getFullYear()+"-"+(dt.getMonth()+1)+"-"+dt.getDate()+" "+dt.getHours();
        emit(key, { count:1, date:key });
      },
      reduce: function(key, values) {
        var obj = {};
        var count = 0;
        var person_score = [];
        for(var i = 0; i < values.length; i++){
          var v = values[i];
          count+=v.count;
          obj.date=v.date;
        }
        obj.count=count;
        return obj;
      },
      out : { inline : 1 },
      sort:{"call_time":1},
      query: params
    }

    var audioModel = this.model("audio");
    yield function(callback) {
      audioModel.mapReduceRow(o, function(err, rows) {
        if (err) {
          status = 400;
        } else {
          result.data=[];
          for(var i in rows){
            result.data.push(rows[i]['value'])
          }
          callback();
        }
      });
    }
    result.title =  '分析报表-来电时间';
    result.from = from;
    result.to = to;
    var common = self.library("common");
    result.common = common;
    this.body=result
    yield self.render('/charts/call_time', result);
  });

  /**
  *@desc 满意度分析报表
  *@param from 开始时间
  *@param to  结束时间
  *@author bcl
  */
  $.get("/charts/satisfied", function*(next) {
    var self = this;
    self.state.session = self.session;
    //admin 或 manager 角色才可访问
    if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
      self.redirect('/login');
      return;
    }
    var _params = this.request.query;
    var result = {};
    var params ={};
    var status = 200;
    var condition={};
    var from = _params["from"] ? Number(_params["from"].trim()) : "";
    var to = _params["to"] ? Number(_params["to"].trim()) : "";
    if(from != ''){
      params.call_time = {$gte: from, $lt: to};
    }
    var o = {
      map: function() {
        var key = this.satisfy_comment;
        emit(key, { count:1, satisfy_comment:key });
      },
      reduce: function(key, values) {
        var obj = {};
        var count = 0;
        var satisfy_comment="";
        var person_score = [];
        for(var i = 0; i < values.length; i++){
          var v = values[i];
          if(v.satisfy_comment != ""){
            count+=v.count;
            satisfy_comment=v.satisfy_comment;
          }
        }
        obj.satisfy_comment=satisfy_comment;
        obj.count=count;
        return obj;
      },
      out : { inline : 1 },
      query: params
    }

    var audioModel = this.model("audio");
    yield function(callback) {
      audioModel.mapReduceRow(o, function(err, rows) {
        if (err) {
          status = 400;
        } else {
          result.data=[];
          for(var i in rows){
            if(rows[i]['value'].satisfy_comment !=''){
              result.data.push(rows[i]['value'])
            }
          }
          callback();
        }
      });
    }
    result.title =  '分析报表-满意度';

    result.from = from;
    result.to = to;
    var common = self.library("common");
    result.common = common;
    this.body=result
    yield self.render('/charts/satisfied', result);
  });
  //关键词分析报表
  $.get("/charts/keywords", function*(next) {
    var self = this;
    self.state.session = self.session;
    //admin 或 manager 角色才可访问
    if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
      self.redirect('/login');
      return;
    }
    var _params = this.request.query;
    var result = {};
    var params ={};
    var status = 200;
    var from = _params["from"] ? Number(_params["from"].trim()) : "";
    var to = _params["to"] ? Number(_params["to"].trim()) : "";
    var emotion_type = _params["emotion_type"]?_params["emotion_type"]:"0";
    if(from != ''){
      params.call_time = {$gte: from, $lt: to};
    }
    var condition={};
    condition = {
      _id:0,
      keywords:1
    }
    var audioModel=this.model("audio");
    var keywordJson = [];
    yield function(callback) {
      audioModel.getColumnRows(params, condition,function(err, rows) {
        if(!err){
          for(i in rows){
            if(rows[i].keywords !=''){
              keywordJson = keywordJson.concat(rows[i].keywords)
            }
          }
        }
        callback();
      });
    }

    var common = self.library("common");
    common.clearArray(keywordJson);
    var objects = [];
    keywordJson.forEach(function(obj){
      if(objects[obj.type]){
        objects[obj.type]++;
      }else{
        objects[obj.type] = 1;
      }
    });

    var keywordsType=this.model("rule_keyword_type");
    var keywordTypes={};
    var keywordMap={};
    yield function(callback) {
      keywordsType.getColumnRows({},{content:1},function(err,rows){
        if (err) {
          status = 400;
        } else {
          keywordTypes = rows;
          rows.forEach(function(obj){
            keywordMap[obj._id]=obj.content;
          });
        }
        callback();
      })
    }
    result.keywordTypes=keywordTypes;
    result.data=[];
    for(var i in objects){
      var obj ={
        "type":keywordMap[i],
        "count":objects[i]
      }
      result.data.push(obj)
    }

    result.title =  '分析报表-关键词分类';
    result.from = from;
    result.to = to;
    result.emotion_type = emotion_type;
    var common = self.library("common");
    result.common = common;
    this.body=result
    yield self.render('/charts/keywords', result);
  });



  /**
  *@desc 热刺分析（质检出现的高频词汇）
  *@param
  *@author
  */
  $.get("/charts/hotwords", function*(next) {
    var self = this;
    self.state.session = self.session;
    //admin 或 manager 角色才可访问
    if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
      self.redirect('/login');
      return;
    }
    var _params = this.request.query;
    var result = {};
    var status = 200;
    var from = _params["from"] ? Number(_params["from"].trim()) : "";
    var to = _params["to"] ? Number(_params["to"].trim()) : "";
    if(from != ''){
      params.call_time = {$gte: from, $lt: to};
    }

    var audioModel=this.model("audio");
    var wordJson = [];
    yield function(callback) {
      audioModel.getColumnRows({}, { _id:0, words:1 },function(err, rows) {
        if(!err){
          for(i in rows){
            if(rows[i] !=''){
              wordJson = wordJson.concat(rows[i].words)
            }
          }
        }
        callback();
      });
    }

    var common = self.library("common");
    common.clearArray(wordJson);
    var objects = [];
    wordJson.forEach(function(obj){

      if(objects[obj]){
        objects[obj]++;
      }else{
        objects[obj] = 1;
      }
    });

    result.data=[];
    for(var i in objects){
      var obj ={
        "name":i,
        "value":objects[i]
      }
      if(config.get("hotwords").indexOf(i) == -1){
        result.data.push(obj);
      }
    }

    var _lodash = require('lodash');
    result.data = _lodash.orderBy(result.data,['count'],['desc']);
    result.data.splice(200,result.data.length);
    result.title =  '分析报表-热词分析';
    result.from = from;
    result.to = to;
    var common = self.library("common");
    result.common = common;
    yield self.render('/charts/hotwords', result);
  });

}
