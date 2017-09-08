module.exports = function (options) {
  options = typeof options === 'object' ? options : {};

  function generateToken(expires, identity){
      var crypto = require('crypto');
      var md5 = crypto.createHash('md5');
      md5.update(options.secret+expires+identity, 'utf8');
      return (md5.digest('hex')+expires).toLowerCase();
  };

  function verifyToken(token, identity){
      var signature = token.substring(0,32);
      var expires = token.substring(32,45);

      if(expires < new Date().getTime()){
          return false;
      }

      var crypto = require('crypto');
      var md5 = crypto.createHash('md5');
      md5.update(options.secret+expires+identity, 'utf8');

      if(md5.digest('hex') != signature){
          return false;
      }

      return true;
  };

  return function *(next){
      this.generateToken = generateToken;
      this.verifyToken = verifyToken;
      return yield * next;
  }
}
