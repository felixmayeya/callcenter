/**
*@desc 创建mongodb连接对象，用户非http请求类的的调用
*@author fanxd
*/
function mongodb(){
  var config = require('config');
  var mongoose   = require('mongoose');
  var mongodb_conf = config.get("mongodb");

  //链接数据库
  mongoose.connect(mongodb_conf.host,mongodb_conf.extra);
  var db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function() {
    // we're connected!
    console.log('# mongodb connected.');
  });

  return db;
}

module.exports = mongodb();
