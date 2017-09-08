//任务model
var Scheme = new require('mongoose').Schema({
    source_system : { type : String, default : ''  },  //所属系统
    assign_person : { type : String, default : ''  },  //分配人员
	operator      : { type : String, default : ''  },  //操作人
	assign_mumber : { type : Number, default : '0' },  //分配数量
	plan_status   : { type : Number, default : ''  },  //计划状态; 0:未启动；1:启动
	stat_date     : { type : Number, default : '0' },  //开始日期
	end_date      : { type : Number, default : '0' },  //结束日期
	date_polt     : { type : String, default : '0' },  //时间点
	complete_days : { type : Number, default : '0' },  //完成期限
	created       : { type : Number, default : Date.now, index : true} //记录插入时间
});

Scheme.statics.getRowsCount = function (params, cb) {
    this.count(params, cb);
};

Scheme.statics.getRows = function (params, cb) {
    this.find(params).sort({ created: -1}).exec(cb);
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
