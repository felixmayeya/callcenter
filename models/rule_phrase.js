//通用词组

var Scheme = new require('mongoose').Schema({
  name      : { type  : String, default : '' }, //词组名称
  content   : { type  : String, default : '' }, //内容
  status    : { type  : Number, default : 1 }, //状态，0 未启用，1 启用
  username  : { type  : String, default : ''},//编辑用户
  rule      : { type  : String, default:'all'},//所属规则 all 所有规则适用，否则适用各自规则
  created   : { type  : Number, default : Date.now, index : true } //创建时间
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
  this.findOneAndUpdate(condition, params, {new:true}, cb);
};

Scheme.statics.deleteRow = function (condition, cb) {
  this.remove(condition, cb);
};

module.exports = Scheme;