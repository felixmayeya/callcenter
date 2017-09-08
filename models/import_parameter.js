//上传请求路径参数对照表
var Scheme = new require('mongoose').Schema({
    radio_path                  : { type : String, default : '' }, //音频路径
    ticket_path                 : { type : String, default : '' }, //音频的报单路径
    upload_type                 : { type : Number, default : '' }, //上传方式;0:手动;1:自动；
    file_type                   : { type : Number, default : '' }, //文件类型；1:CSV;2:JSON;3:xml
    items                       : {
          item_seq   			      : { type : String, default : '' }, //录音流水号字段名称
          item_sit_number       : { type : String, default : '' }, //坐席工号的字段名称
          item_mobile           : { type : String, default : '' }, //来电号码
          item_call_time        : { type : String, default : '' }, //呼叫时间
          item_system           : { type : String, default : '' }, //接入系统
          item_customer_name    : { type : String, default : '' }, //客户名称
          item_end_comment      : { type : String, default : '' }, //话后总结
          item_satisfy_comment  : { type : String, default : '' }, //满意度评价
          item_call_duration    : { type : String, default : '' }, //通话时长
          item_mute_ratio       : { type : String, default : '' }, //静音比
          item_customer_speed   : { type : String, default : '' }, //用户语速
          item_agent_speed      : { type : String, default : '' }, //坐席语速
          item_mute_duration    : { type : String, default : '' } //静音时长
        }
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
