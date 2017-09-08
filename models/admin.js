var ModelSchema = new require('mongoose').Schema({
    username : { type : String, default : ''},
    password : { type : String, default : ''},
    role     : { type : String, default : ''},
    photo    : { type : String, default : ''},
    created  : { type : Date,   default : Date.now }
});

ModelSchema.statics.getRows = function (params, cb) {
    this.find(params).sort({ created: -1}).exec(cb);
};

ModelSchema.statics.createRow = function (params, cb) {
    this.create(params, cb);
};

ModelSchema.statics.getRow = function (params, cb) {
    this.findOne(params, cb);
};

ModelSchema.statics.updateRow = function (condition, params, cb) {
    this.update(condition, params, cb);
};

ModelSchema.statics.delRow = function (condition, cb) {
    this.remove(condition, cb);
};

module.exports = ModelSchema;
