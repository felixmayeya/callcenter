//数据导入配置信息
var Scheme = new require('mongoose').Schema({
	system      : { type : String, default : '' }, 		  //所属业务
	radio_path      : { type : String, default : '' }, 		  //音频路径
	files_path      : { type : String, default : '' }, 		  //话单路径
	upload_type     : { type : String, default : '' }, 		  //上传方式；0：手动；1：自动
	file_type       : { type : String, default : '' }, 		  //文件类型；0；CSV; 1：JSON; 2：XML
	item_auto_time  : { type : String, default : '' }, 		  //自动执行导入的时间JOB
	interface_name  : { type : String, default : '' }, 		  //如果是接口方式，需要维护接口名称；
	//如果是接口方式，需要维护接口输入参数；JSON格式;
	//例如：{"channel_f" : "channel_t", "start_date_f" : "start_date_t","end_date_f" : "end_date_t"}
	//其中如：start_date_f 是第三方接口输入需要的参数的名称；start_date_t 为本系统的参数名称；
	//最终组装成一个长的串：channel_f=xx&start_date_f=1503295643906.0&end_date_f=15033349564.0
	interface_input : { type : String, default : '' },
	items           : {
		item_seq   						: { type : String, default : '' }, //录音流水号字段名称
		item_sit_number       : { type : String, default : '' }, //坐席工号的字段名称
		item_mobile           : { type : String, default : '' }, //来电号码
		item_call_time        : { type : String, default : '' }, //呼叫时间
		item_audio_path           : { type : String, default : '' }, //录音文件路径
		item_customer_id      : { type : String, default : '' }, //客户标识
		item_customer_name    : { type : String, default : '' }, //客户名称
		item_end_comment      : { type : String, default : '' }, //话后总结
		item_satisfy_comment  : { type : String, default : '' }, //满意度评价
		item_call_duration    : { type : String, default : '' }, //通话时长
		item_sit_team         : { type : String, default : '' }, //坐席组
		item_channel          : { type : String, default : '' }//接入渠道

	},

	import_type     : { type : String, default : '' }, //导入类型；1：文件拷贝；2：FTP方式；3：FTP接口方式；
	created_time    : { type : Number, default : Date.now, index : true} 	// 创建日期

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

module.exports = Scheme;
