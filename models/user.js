//用户

var Scheme = new require('mongoose').Schema({

    //账号信息
    username    : { type : String, default : '' },//用户名
    nickname    : { type : String, default : '' },//用户昵称
    password    : { type : String, default : '' },//密码
    avatar      : { type : String, default : '' },//头像
    sit_number  : { type : Number, default : 0 }, //坐席工号
    //角色
    role        : { type : String, default : '' },//角色
    user_group  : { type : String, default : '' },//所属业务组

    //个人基本信息
    age         : { type : Number, default : 0 },
    gender      : { type : Number, default : 0 },
    birthday    : { type : String, default : '' },
    blood       : { type : String, default : '' },
    horoscope   : { type : String, default : '' },
    height      : { type : Number, default : 0 },
    weight      : { type : Number, default : 0 },
    hobby       : { type : String, default : '' },
    bust        : { type : Number, default : 0 },
    waistline   : { type : Number, default : 0 },
    hipline     : { type : Number, default : 0 },

    //联系方式
    mobile      : { type : String, default : '' },
    email       : { type : String, default : '' },
    qq          : { type : String, default : '' },
    weixin      : { type : String, default : '' },
    weibo       : { type : String, default : '' },


    //教育信息
    school      : { type : String, default : '' },
    degree      : { type : String, default : 0 },

    //职业信息
    industry    : { type : String, default : '' },
    company     : { type : String, default : '' },

    last_login  : { type : Number, default : 0 },

    created     : { type : Number, default : Date.now, index : true }
});

Scheme.index({gps:'2d'});

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
