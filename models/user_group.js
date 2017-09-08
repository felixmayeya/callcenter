//业务组

var Scheme = new require('mongoose').Schema({
    name        : { type : String, default : '' }, //名称
    description : { type : String, default : '' }, //描述
    type        : { type : String ,default : ''},//业务组类型  omni 座席组，worker 质检组
    created     : { type : Number, default : Date.now, index : true}
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
