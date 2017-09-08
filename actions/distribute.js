module.exports = function($) {

  /**
  *@desc 录音监控
  *@param from 开始时间
  *@param to 结束时间
  *@param  audio_id 录音id
  *@param sit_number 座席工号
  *@param status 状态
  *@author fanxd
  */
  $.get("/audios/distribute", function*(next) {
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
    var params = {};

    var offset = _params.offset ? _params.offset : 0;
    var limit = _params.limit ? _params.limit : config.get("limit");
    var from = _params["from"] ? Number(_params["from"].trim()) : "";
    var to = _params["to"] ? Number(_params["to"].trim()) : "";
    if(from != ''){
      params.created_time = {$gte: from, $lt: to};
    }
    var audio_id = _params["audio_id"] && _params["audio_id"] !== "all"?_params["audio_id"]:"";//录音id
    if (audio_id != '') {
      params.audio_id = audio_id;
    }
    var sit_number = _params["sit_number"] && _params["sit_number"] !== "all"?_params["sit_number"]:"";//座席工号
    if (sit_number != '') {
      params.sit_number = sit_number;
    }
    var _status = _params["status"] && _params["status"] !== "all"?_params["status"]:"";//座席工号
    if (_status !== '') {
      params.status = _status;
    }

    var distributeModel  = this.model("distribute");
    var totalPage={};
    yield function(callback) {
      distributeModel.getRowsCount(params, function(err, count) {
        if(!err){
          totalPage = Math.ceil(count / limit);
        }
        callback();
      });
    }

    yield function(callback) {
      distributeModel.getPagedRows(params, offset, limit, { created: -1 }, function(err, rows) {
        if (err) {
          status = 400;
        } else {
          result = {
            rows: rows,
            from:from,
            to:to,
            audio_id: audio_id,
            sit_number: sit_number,
            status: _status,
            offset: offset,
            limit: limit,
            totalPage: totalPage
          };
        }
        callback();
      });
    }

    var audios = {};
    yield function(callback){
      distributeModel.getColumnRows({},{_id:0,audio_id:1,audio_seq:1},function(err,rows){
        if(!err){
          result.audios = rows;
        }
        callback();
      });
    }

    var userModel=this.model("user");
    yield function(callback) {
      userModel.getColumnRows({'role':'omni'},{_id:0,sit_number:1,username:1},function(err,row){
        if (!err && row) {
          result.sitList=row;
        }
        callback();
      })
    }

    result.title =  '录音学习监督';
    var common = self.library("common");
    result.common = common;
    yield self.render('/audios/distribute', result);
  });


  /**
  *@desc 录音分配
  *@param audioIds 录音列表id
  *@param userIds 用户列表id
  *@author fanxd
  */
  $.post("/audios/distribute", function*(next) {
    var self = this;
    self.state.session = self.session;
    //admin 或 manager 角色才可访问
    if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
      self.redirect('/login');
      return;
    }
    var result = {};
    var status = 200;
    var _params = this.request.fields;
    var audioIds  = _params.audios;
    var userIds = _params.students;

    var userModel=this.model("user");
    var audioModel=this.model("audio");
    var distributeModel=this.model("distribute");


    //验证是否重复分配
    for(var i=0;i<userIds.length;i++){
      var userId = userIds[i];
      for(var j=0;j<audioIds.length;j++){
        var audioId =  audioIds[j];
        yield function(callback){
          distributeModel.getRow({ audio_id : audioId,user_id:userId}, function(err, row){
            if (!err && row) {
              result = {
                code : "20002",
                msg : "请勿重复分配！"
              };
            }
            callback();
          });
        }

        if(result && result.code ==="20002"){
          this.status = status;
          this.body = result;
          return;
        }
      }
    }

    for(var i=0;i<userIds.length;i++){
      var userId = userIds[i];
      var user = {};
      yield function(callback){
        userModel.getColumnRow({ _id : userId },{ username : 1,sit_number:1},function(err,row){
          if(!err){
            user = row;
          }
          callback();
        });
      }

      for(var j=0;j<audioIds.length;j++){
        var audioId =  audioIds[j];

        var audio = {};
        yield function(callback){
          audioModel.getColumnRow({ _id:audioId},{seq:1,call_duration:1},function(err,row){
            if(!err){
              audio = row;
            }
            callback();
          });
        }

        var params= {
          audio_id   		: audioId, //录音id
          audio_seq	    : audio.seq, //录音流水号
          user_id 			: userId, //USER ID
          username	    : user.username, //用户名
          sit_number : user.sit_number,//座席工号
          editname    : self.session.user.username, //编辑用户
          call_duration : audio.call_duration //录音时长
        }


        yield function(callback){
          distributeModel.createRow(params, function(err, row){
            if (!err && row) {
              result = {
                code : "20000",
                msg : "录音分配成功"
              };
            } else {
              result = {
                code : "20001",
                msg :"录音分配失败!"
              };
              status = 400;
            }
            callback();
          });
        }

      }
    }

    this.status = status;
    this.body = result;
  });

  /**
  *@desc 录音学习
  *@param
  *@author
  */
  $.get("/audios/study", function*(next) {
    var self = this;
    //将session放入ejs渲染数据中
    self.state.session = self.session;

    //admin 或 manager 角色才可访问
    if (!self.session.user || !(self.session.user.role == 'omni')) {
      self.redirect('/login');
      return;
    }
    var _params = this.request.query;
    var params = {};
    var result = {};
    var status = 200;

    var offset = _params.offset ? _params.offset : 0;
    var limit = _params.limit ? _params.limit : config.get("limit");
    var from = _params["from"] ? _params["from"] : "";
    var to = _params["to"] ? _params["to"] : "";
    if (from !== '' && to !== '') {
      params["created_time"] = { "$gte": from, "$lt": to };
    }
    var _status = _params["status"] && _params["status"]!== "all" ? _params["status"] : "";
    if (_status !== '') {
      params["status"] = _status;
    }
    params.sit_number =self.session.user.sit_number;

    var distributeModel  = this.model("distribute");
    //总页数
    yield function(callback) {
      distributeModel.getRowsCount(params, function(err, count) {
        if (err) {
          status = 400;
        } else {
          var totalPage = Math.ceil(count / limit);
          result.totalPage = totalPage;
          callback()
        }
      })
    }
    var distributes = {};
    yield function(callback) {
      distributeModel.getPagedRows(params, offset, limit, { created: -1 }, function(err, rows) {
        if (err) {
          status = 400;
        } else {
          distributes = rows;
          callback();
        }
      });
    }

    var audioModel = this.model("audio");
    var audios = [];
    for(var i=0;i<distributes.length;i++){
      var distribute =  distributes[i];
      var audio = {};
      yield function(callback){
        audioModel.getRow({_id:distribute.audio_id},function(err,row){
          if(!err && row){
            audio = row;
            audio.status =distribute.status;
          }
          callback();
        });
      }
      audios.push(audio);
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

    result.title =  '录音学习';
    result.conts = audios;
    result.from = from;
    result.to = to;
    result.offset = offset;
    result.limit = limit;
    result.status =_status;
    var common = self.library("common");
    result.common = common;
    yield self.render('/audios/study', result);
  });


  /**
  *@desc 标记录音学习
  *@param audioIds 录音列表id
  *@author fanxd
  */
  $.post("/audios/study", function*(next) {
    var self = this;
    self.state.session = self.session;
    //admin 或 manager 角色才可访问
    if (!self.session.user || !(self.session.user.role == 'omni' )) {
      self.redirect('/login');
      return;
    }
    var result = {};
    var status = 200;
    var audio_ids = this.request.fields.audio_ids;

    var distributeModel=this.model("distribute");

    for(var i=0;i<audio_ids.length;i++){
      yield function(callback){
        distributeModel.getRow({audio_id :audio_ids[i],start_time:null},function(err,row){
          if(!err && row){
            result={
              code : "20002",
              msg : "未开始学习，不能标记结束学习"
            }
          }
          callback();
        });
      }
    }
    if(result && result.code ==="20002"){
      this.status = status;
      this.body = result;
      return;
    }

    for(var i=0;i<audio_ids.length;i++){
      yield function(callback){
        distributeModel.updateRow({audio_id :audio_ids[i]},{status:1,end_time:Date.now()},function(err,row){
          if(!err){
            result={
              code : "20000",
              msg : "学习完成"
            }
          }else{
            status = 400;
            result={
              code : "20001",
              msg : "学习失败"
            }
          }
          callback();
        });
      }
    }


    this.status = status;
    this.body = result;
  });


  /**
  *@desc 关闭录音学习
  *@param audioId 录音id
  *@author fanxd
  */
  $.put("/audios/study/:type/:id", function*(next) {
    var self = this;
    self.state.session = self.session;
    //admin 或 manager 角色才可访问
    if (!self.session.user ) {
      self.redirect('/login');
      return;
    }
    var result = {};
    var status = 200;
     var audio_id = this.params.id;
    var type = this.params.type;

    if(type === "study"){
      var distributeModel=this.model("distribute");
      var distribute = {};
      yield function(callback){
        distributeModel.getRow({audio_id:audio_id},function(err,row){
          if(!err){
            distribute = row;
          }
          callback();
        });
      }
      distribute.end_time = Date.now();
      distribute.study_duration = distribute.end_time-distribute.start_time;
      distribute.total_study_duration = distribute.total_study_duration+distribute.study_duration;

      yield function(callback){
        distributeModel.updateRow({audio_id:audio_id},distribute,function(err,row){
          if(!err){
            result={
              code : "20000",
              msg : "关闭学习"
            }
          }
          callback();
        });
      }
    }

    this.status = status;
    this.body = result;
  });


}
