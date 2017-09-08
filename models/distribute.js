//分配录音

var Scheme = new require('mongoose').Schema({
  audio_id   		         : { type : String, default : '' }, //录音id
  audio_seq	             : { type : String, default : '' }, //录音流水号
  call_duration          : { type : Number, default : 0 },  //通话时长
  user_id 			         : { type : Object, default : '' }, //USER ID
  sit_number             : { type : Number, default : 0 },  //坐席工号
  username	             : { type : String, default : '' }, //用户名
  start_time             : { type : Number, default : ''},  //开始学习时间
  end_time               : { type : Number, default : ''}, 	//结束学习时间
  last_start_time        : { type : Number, default : ''},  //上次学习开始时间
  last_end_time          : { type : Number, default : ''}, 	//上次学习结束时间
  study_duration         : { type : Number, default : 0 },  //学习时长
  last_study_duration    : { type : Number, default : 0 },  //上次学习时长
  total_study_duration   : { type : Number, default : 0 },  //累计学习时长
  study_count            : { type : Number, default : 0 },  //累计学习次数
  status                 : { type : Number, default : 0 },  //状态，0 未学习，1 已学习,3 学习中
  editname               : { type : String, default : '' },  //编辑用户
  created_time           : { type : Number, default : Date.now, index : true} 	// 创建日期
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
