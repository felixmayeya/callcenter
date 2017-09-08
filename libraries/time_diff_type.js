/**
*@desc 计算两个时间段内相差级别（年，月，日,小时，分钟）
*@param startTime 开始日期
*@param endTime 结束日期
*@param format 日期格式 YYYY-MM-DD HH:mm:ss
*@author fanxd
*@return 相差级别（year、month、day）
*/
function timeDiffType(startTime,endTime,format){

  var moment = require('moment');

  var start = moment(startTime,format);
  var end = moment(endTime,format);
  if(end.diff(start, 'years')){
    return "year";
  }else if(end.diff(start, 'months')){
    return "month";
  }else if(end.diff(start, 'days')){
    return "day";
  }else if(end.diff(start, 'hours')){
    return "hour";
  }else{
    return "minute";
  }
}

module.exports = timeDiffType;
