//批量导入文件状态信息
var Scheme = new require('mongoose').Schema({
    batch_number   : { type : String, default : '' }, 		// 批次号
    import_date    : { type : Number, default : Date.now, index : true}, 	// 导入日期
    status         : {type  : Number, default :0}, //０．导入成功，１导入失败
    person         : { type : String, default : '' }, 		// 批次号
    start_time     : { type : Number, default : 0,index :true}, 	// 导入开始时间
    end_time       : { type : Number, default : Date.now, index : true}, 	// 导入结束时间
    total          : { type : Number, default :0}, //导入总记录
    success        : { type : Number, default :0}, //导入成功记录
    failure        : { type : Number, default :0}, //导入失败记录
    operation_type : { type : Number, default :0}, //导入类型：０．手动导入　１自动导入
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
