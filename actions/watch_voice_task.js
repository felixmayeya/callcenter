/**
*@desc 定时执行语音转换任务
*@author fanxd
*/
module.exports=function scheduleCronstyle(){

  var schedule = require('node-schedule');
  schedule.scheduleJob('30 1 1 1 2018 *', function(){
    var config = require('config');
    var exec = require('child_process').exec;
    console.log('scheduleCronstyle:' + new Date());
    exec(config.get('conver_voice_shell')+" "+config.get('upload_voice_path')+" "+config.get('conver_xml_path'), function(err,stdout,stderr){
      if(err) {
        console.log(stderr);
      } else {
        console.log("成功"+stdout);
      }
    });
  });
}
