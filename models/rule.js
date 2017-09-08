//规则

var Scheme = new require('mongoose').Schema({
    name   		: { type : String, default : '' }, 		// 规则名称
    rule_group  : { type : String, default : '' }, 	// 所属规则集
    status      : { type : Number, default : 0 }, 	// 状态，0 未启用，1 启用
    content 	: {	type : String, default : ''},	// 规则内容
    parser_content 	: {	type : String, default : ''},	// 解析后规则内容
    remarks 	: {	type : String, default : ''},	// 备注
    created     : { type : Number, default : Date.now, index : true}//创建时间
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
