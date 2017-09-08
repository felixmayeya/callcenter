//音频文件

var Scheme = new require('mongoose').Schema({
  seq   			    : { type : String, default : '' }, //音频流水号
  agent 			    : { type : String, default : '' }, //USER ID
  customer 		    : {
    id : { type : String, default : '' }, //客户标识
    name : { type : String, default : '' }, //客户名称
    mobile : { type : String, default : '' }, //电话号码
  },
  speed           : { type : Number, default : 0 }, //语速
  customer_speed  : { type : Number, default : 0 }, //用户语速
  sit_number      : { type : Number, default : 0 }, //坐席工号
  agent_speed     : { type : Number, default : 0 }, //坐席语速
  sit_team        : { type : String, default : '' }, //坐席组

  system          : { type : String, default : '' }, //接入系统
  channel         : { type : String, default : '' }, //接入渠道

  call_time       : { type : Number, default : 0}, //呼叫时间
  call_duration   : { type : Number, default : 0 }, //通话时长

  mute_duration   : { type : Number, default : 0 }, //静音时长
  mute_ratio      : { type : Number, default : 0 }, //静音比
  customer_mute_time : { type : Number, default : 0 },//客户静音总时长
  customer_mute_ratio : { type : Number, default : 0 }, //客户静音比
  omni_mute_time : { type : Number, default : 0 },//座席静音总时长
  omni_mute_ratio : { type : Number, default : 0 },//座席静音比

  radio_type      : { type : String, default : '' },  //文件类型；1：批量导入；2：语音上传

  qa_group        : {type  : String, default : ''},//质检组

  qa_person       : { type : String, default : '' },  //质检员ID，用于任务分配
  start_date      : { type : Number, default : ''},  //开始质检的日期
  completed_date  : { type : Number, default : ''},  //完成质检的日期
  qa_completed_date:{ type : Number, default : ''}, //质检完成日期
  assign_status   : { type : Number, default : 0 }, //分配状态 0 未分配， 1 已分配质检员， 2 不予分配，3 已分配质检组
  score           : { type : Number, default : 0 },  //分数
  assign_to       : { type : String, default : '' }, //质检员名称

  machine_score	  : { type : Number, default : 0 },  //智能得分(智能质检结果)
  machine_result  : { type : Object, default : ''},  //智能质检结果

  addtional_score	: { type : Number, default : 0 },  //附加分
  person_score	  : { type : Number, default : 0 },  //人工得分(人工质检结果)
  person_result   : { type : String, default : ''},  //人工质检结果
  decrease_reason : { type : String, default : '' },//人工扣分原因
  end_comment     : { type : String, default : '' }, //话后总结
  satisfy_comment : { type : String, default : '' }, //满意度评价
  os_history      : { type : String, default : '' }, //操作历史
  recheck_status  : { type : Number, default : 0 }, //复议状态  0 未申请 1 已申请,2 已评审,3 已驳回
  recheck_reason  : { type : String, default : '' }, //复议原因

  qa_history      : { type : Object, default : '' }, //人工质检历史

  label 		      : { type : String, default : '' },//标签
  label_details   : { type : String, default : '' },//标签细则
  label_type      : { type : String, default : '' },//标签类型
  label_remarks	  : { type : String, default : '' },//备注

  question        : { type : String, default : '' },//问题
  question_time   : { type : Number, default : 0  }, //问题时间
  answer          : { type : String, default : '' },//问题答案
  answer_type     : { type : Number, default : 0 },//问题类型
  remarks			    : { type : String, default : '' },//备注
  marked_study    : { type : Number, default : 0 },//是否标记为学习型录音；0：否；1：被标记为学习录音；

  created         : { type : Number, default : Date.now, index : true}, //记录录入日期
  //上传信息
  upload_audio 	  : {
    upload_audio_name   : { type : String, default : '' }, //录音名称
    upload_audio_size   : { type : String, default : '' }, //录音大小；带单位，KB/MB...所以用string
    upload_audio_date   : { type : Number, default : Date.now, index : true},//录音上传时间
    upload_audio_type    : { type : String, default : '' } //录音格式 0:PCM(8K16BIT)、1:GSM6.10、2:视频MOV(单音轨)
  },
  audio_status    : {
    upload_status :{type : Number, default : 0},//上传状态 0 未上传,1 已上传
    conver_status :{type : Number, default : 0},//语言转换状态 0 未转换,1 已转换
    auto_inspection_status : {type : Number, default : 0},//智能质检状态 0 未检测,1 已检测
    manual_inspection_status : {type:Number, default : 0},//人工质检状态 0 未检测,1 已检测
  },
  //语音分析信息
  dialog_json    : { type : Object, default : '' }, //对话名称的json数据,包括时间和语速等详细信息
  dialog_text    : { type : Object, default : '' }, //只有语音的文本信息
  radio_path     : { type : String, default : '' },  //语音文件的路径，和语音文件一一对应，通过此path，可以唯一定位到一个语音文件；

  emotion_json    : { type : Object, default : '' }, //带情绪的对话内容,包括时间和语速等详细信息
  omni_emotion_json    : { type : Object, default : '' }, //座席带情绪的对话内容,包括时间和语速等详细信息
  customer_emotion_json    : { type : Object, default : '' }, //客户带情绪的对话内容,包括时间和语速等详细信息
  keywords       : { type : Object, default : '' }, //文件中出现的所有关键字 ，时间和关键字
  words          : { type : Array, default : '' } //文件中出现的所有关键字


});
Scheme.statics.getRowsCount = function (params, cb) {
  this.count(params, cb);
};

Scheme.statics.getRows = function (params, cb) {
  this.find(params).sort({ created: -1}).exec(cb);
};

Scheme.statics.getColumnRows = function (condition,params, cb) {
  this.find(condition,params).sort({ created: -1}).exec(cb);
};

Scheme.statics.getColumnRow = function (condition,params, cb) {
  this.findOne(condition,params).sort({ created: -1}).exec(cb);
};

Scheme.statics.getPagedRows = function (params, skip, limit, sort, cb) {
  skip = parseInt(skip);
  limit = parseInt(limit);
  this.find(params).sort(sort).skip(skip).limit(limit).exec(cb);
};

Scheme.statics.createRow = function (params, cb) {
  this.create(params, cb);
};

Scheme.statics.getRow = function (params, cb) {
  this.findOne(params, cb);
};

Scheme.statics.updateRow = function (condition, params, cb) {
  this.update(condition, params, cb);
};


Scheme.statics.findOneAndUpdateRow = function (condition, params, cb) {
  this.findOneAndUpdate(condition, params, {new:true,upsert:true,setDefaultsOnInsert:true}, cb);
};


Scheme.statics.deleteRow = function (condition, cb) {
  this.remove(condition, cb);
};

Scheme.statics.mapReduceRow = function (params, cb) {
  this.mapReduce(params,cb);
};

module.exports = Scheme;
