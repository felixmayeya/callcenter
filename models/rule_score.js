//评分规则

var Scheme = new require('mongoose').Schema({
    system     : { type : String, default : '' }, //所属系统
    rule_base  : { type : String, default : '' }, //规则库
    type       : { type : String, default : '' },//评分类型
    rule       : { type : String, default : '' }, //质检规则
    user       : { type : String, default : '' }, //质检对象
   // measure    : { type : String, default : '' }, //质检指标
    reason     : { type : String, default : '' }, //扣分原因
    score      : { type : Number, default : 0 }, //分值
    available  : { type : Number, default : 0 }, //可用分值
    addtl_desc 	   : {type : String ,default : ''},//附加值描述
    rule_type  : {type : String ,default : ''},//不同的表名
    created    : { type : Number, default : Date.now, index : true } //创建时间
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

Scheme.statics.aggregateRow = function (condition, cb) {
  this.aggregate(condition, cb);
};

module.exports = Scheme;
