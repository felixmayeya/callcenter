/*
  options{
    enabled:true,
    debug:false,
    secret:''
    keys: {
        key:secret,
    }
  }
*/

module.exports = function (options) {
  options = typeof options === 'object' ? options : {};

  //加载验证类型配置参数
  var regTypes = {};

  for(var i in options.types){
    var pathToRegexp = require('path-to-regexp');
    var keys = [];
    if(options.types[i]['urls'].length > 0){
      var re = pathToRegexp(options.types[i]['urls'], [keys]);
      regTypes[i] = re;
    }
  }

  /**
   * 对请求签名
   * @param secret 应用密钥
   * @param url 请求完整路径，不带参数
   * @param method 请求的方法，'GET','POST'等
   * @param params 所有请求参数，包括appkey 和 targetService
   * @return {Object} 追加了签名后的所有参数的集合
   */
  function sign(secret, url, method, params) {
      /**
       * 序列化参数集合
       * @param params Map[String, String] or Map[String, List[String]]
       */
      function serialize(params){
          var key, result, kvs, keys, _i, _len;
          keys = [];
          kvs = [];
          for (key in params) {
              keys.push(key);
          }
          keys.sort();
          _len = keys.length;
          for (_i = 0; _i < _len; _i++) {
            var k = keys[_i];
            var v = params[k];
            kvs.push(joinString(k, v));
          }
          result = kvs.join('&');
          result = encodeURIComponent(result);
          return result;
      }

      function joinString(k, v) {
          var tmp = [];
          var i;
          if (isArray(v)) {
            var v1 = v.slice(0);
            v1.sort();
            for (i in v1) {
              tmp.push(k + "=" + v1[i]);
            }
            return tmp.join("&");
          } else {
            return k + "=" + v;
          }
      }

      function isArray(obj) {
          return Object.prototype.toString.call(obj) === '[object Array]';
      }

      var serializedString = method.toLowerCase() + "&" + url + "&" + serialize(params);
      var crypto = require('crypto');
      return crypto.createHmac('sha1', secret).update(serializedString).digest('base64');
  };


  /**
   * 根据secret和expires生成token
   * @param expires 过期时间
   * @param identity token id
   * @return {String} token
   */
  function generateAuthanticationToken(expires, identity) {
      var crypto = require('crypto');
      var md5 = crypto.createHash('md5');

      var timestamp = new Date().getTime()+expires*1000;
      md5.update(options.types.user.secret+timestamp+identity, 'utf8');
      return (md5.digest('hex')+timestamp+identity).toLowerCase();
  };


  function authanticateUser(token, secret) {
      var signature = token.substring(0,32);
      var expired= token.substring(32,45);
      var id = token.substring(45);

      var crypto = require('crypto');
      var md5 = crypto.createHash('md5');
      md5.update(secret+expired+id, 'utf8');
      if(signature != md5.digest('hex')){
        return false;
      }

      this.generateAuthToken = function(id, expired){
        var crypto = require('crypto');
        var md5 = crypto.createHash('md5');
        md5.update(id+expired+secret, 'utf8');
        return md5.digest('hex');
      }

      return true;
  }

  function authanticateApplication(signature, secret, req) {
      if(!signature || !secret){
        return false;
      }

      var host   = req.host;
      var method = req.method;
      var params = req.query;

      if(req.body){
          for(var i in req.body){
              params[i] = req.body[i];
          }
      }

      if(signature){
          var _signature = sign(secret, host+req.path, method, params);

          if (_signature == signature) {
              return true;
          }else{
              return false;
          }
      }else{
          return false;
      }
  };

  return function * (next) {

    this.generateAuthanticationToken = generateAuthanticationToken;

    if(!options.enabled){
      return yield * next;
    }

    //设置当前请求验证类型
    var requestType = {};
    for(var i in regTypes){
        if(regTypes[i].test(this.request.path)){
            requestType[i] = true;
        }
    }

    //获取 Headers 字段
    var key   = this.request.headers['x-authorization-key'];
    var signature = this.request.headers['x-authorization-signature'];
    var token = this.request.headers['x-authorization-token'];

    if(options.debug){
        console.log("host:"+this.request.host+" method:"+this.request.method+" url:"+this.request.path+" type:"+JSON.stringify(requestType)+" token:"+ token +" key:" + key + " signature:"+signature);
    }

    //验证请求
    if(requestType['application'] && requestType['user']){
        if(authanticateApplication(signature, options.types.application.keys[key], this.request) && authanticateUser(token, options.types.user.secret)){
            return yield * next;
        }else{
          this.status = 401;
          return;
        }
    }else if(requestType['application']){
        if(authanticateApplication(signature, options.types.application.keys[key], this.request)){
            return yield * next;
        }else{
          this.status = 401;
          return;
        }
    }else if(requestType['user']){
        if(authanticateUser(token, options.types.user.secret)){
            return yield * next;
        }else{
          this.status = 401;
          return;
        }
    }else{
      return yield * next;
    }
  }
}
