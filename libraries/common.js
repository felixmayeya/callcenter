var helper = module.exports = {}

Date.prototype.format = function(fmt)
{
  var o = {
    "M+" : this.getMonth()+1,                 //月份
    "d+" : this.getDate(),                    //日
    "h+" : this.getHours(),                   //小时
    "m+" : this.getMinutes(),                 //分
    "s+" : this.getSeconds(),                 //秒
    "q+" : Math.floor((this.getMonth()+3)/3), //季度
    "S"  : this.getMilliseconds()             //毫秒
  };
  if(/(y+)/.test(fmt))
  fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
  for(var k in o)
  if(new RegExp("("+ k +")").test(fmt))
  fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
  return fmt;
}

helper.loadModel = function(file){
  var model = require(icecream.get('appDir')+"/model/"+file);
  return model;
}

helper.getActivityType=function(activity_type,default_val){
  for(var i in activity_type){
    if(activity_type[i].type == default_val){
      return activity_type[i].name;
    }
  }
  return "";
}

helper.sanitizeHtml = function(html){
  var sanitizeHtml = require('sanitize-html');
  return sanitizeHtml(html, {
    allowedTags: []
  });
}

helper.format_date = function(time, fmt){
  if(time == null || time == ''){
    return "";
  }

  var dt = new Date(time);
  var o = {
    "M+" : dt.getMonth()+1,                 //月份
    "d+" : dt.getDate(),                    //日
    "h+" : dt.getHours(),                   //小时
    "m+" : dt.getMinutes(),                 //分
    "s+" : dt.getSeconds(),                 //秒
    "q+" : Math.floor((dt.getMonth()+3)/3), //季度
    "S"  : dt.getMilliseconds()             //毫秒
  };
  if(/(y+)/.test(fmt))
  fmt=fmt.replace(RegExp.$1, (dt.getFullYear()+"").substr(4 - RegExp.$1.length));
  for(var k in o)
  if(new RegExp("("+ k +")").test(fmt))
  fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
  return fmt;
}

helper.isImage = function(ext){
  ext = ext.toLowerCase();
  return ext == ".png" | ext == ".jpg" | ext == ".jpeg" | ext == ".gif" | ext == ".png";
}

helper.isVideo = function(ext){
  ext = ext.toLowerCase();
  return ext == ".mp4" | ext == ".3gp" | ext == ".avi" | ext == ".rmvb" | ext == ".rm" | ext == ".mov";
}


helper.isAudio = function(ext){
  ext = ext.toLowerCase();
  return ext == ".mp3";
}

helper.paging = function(url, params, totalPage, offset, limit, interval, _options){
  totalPage = parseInt(totalPage);
  if(totalPage == 0){
    return '';
  }

  offset = parseInt(offset);
  interval = parseInt(interval);
  currentPage = Math.ceil(offset/limit) + 1;

  var options = {
    first:"First",
    prev:"Prev",
    next:"Next",
    last:"Last"
  }

  for(var i in _options){
    options[i] = _options[i];
  }

  var count = 2; //当前页前后分页个数
  var first = 0;
  var prev  = ((currentPage-1 > 0 ? (currentPage-1): 1)-1) * limit;
  var next  = ((currentPage+1 < totalPage ? (currentPage+1): totalPage) - 1)*limit;
  var last  = (totalPage - 1)*limit;
  // var start = (Math.ceil(currentPage/interval)-1)*interval+1;
  // var end   = Math.ceil(currentPage/interval)*interval < totalPage ? Math.ceil(currentPage/interval)*interval : totalPage;

  var html  ="<div class='ui small left pagination menu'>";
  html +="<a class='item' href='"+url+"?"+params+"&offset="+first+"&limit="+limit+"'>首页</a>";
  html +="<a class='item' href='"+url+"?"+params+"&offset="+prev+"&limit="+limit+"'>上一页</a>";

  if(currentPage>=count+2 && currentPage!=1 && totalPage!=count) {
    if(currentPage===count+2){
      html += "<a class='item' href='"+url+"?"+params+"&offset=0"+"&limit="+limit+"'>1</a>"
    }else{
      html += "<a class='item' href='"+url+"?"+params+"&offset=0"+"&limit="+limit+"'>1</a><span  class='seprator'>&sdot;&sdot;&sdot;</span>"
    }
  }

  var end = (currentPage === totalPage || currentPage+count>=totalPage) ? totalPage : currentPage+count;
  var start = (currentPage === totalPage&&totalPage>count+2) ? currentPage - count -2 : totalPage<=count||currentPage<=count ? 1 :currentPage - count;

  for(var i = start; i <= end; i++){
    html +="<a class='item "+(i===currentPage?"active":"")+"' href='"+url+"?"+params+"&offset="+(i-1)*limit+"&limit="+limit+"'>"+i+"</a>";
  }

  if(currentPage+count<totalPage&&currentPage>=1&&totalPage>count){
    if(currentPage+count===totalPage-1) {
      html += "<a class='item' href='"+url+"?"+params+"&offset="+(totalPage-1)*limit+"&limit="+limit+"'>"+totalPage+"</a>"
    } else {
      html += "<span class='seprator'>&sdot;&sdot;&sdot;</span><a class='item' href='"+url+"?"+params+"&offset="+(totalPage-1)*limit+"&limit="+limit+"'>"+totalPage+"</a>"
    }

  }
  // for(var i = start;i <= end;i++){
  //     html +="<a class='item "+(i==currentPage?"active":"")+"' href='"+url+"?"+params+"&offset="+(i-1)*limit+"&limit="+limit+"'>"+i+"</a>";
  // }
  html +="<a class='item' href='"+url+"?"+params+"&offset="+next+"&limit="+limit+"'>下一页</a>";
  html +="<a class='item' href='"+url+"?"+params+"&offset="+last+"&limit="+limit+"'>末页</a>";
  html +="</div>";
  html +="<span style='float:right;'>每页&nbsp;&nbsp;<div class='ui compact selection dropdown limitSelect'><i class='dropdown icon'></i><div class='text'>"+limit+"</div><div class='menu'>";
  html +="<a class='item' href='"+url+"?"+params+"&offset=0&limit=5'>5</a>";
  html +="<a class='item' href='"+url+"?"+params+"&offset=0&limit=10'>10</a>";
  html +="<a class='item' href='"+url+"?"+params+"&offset=0&limit=20'>20</a>";
  html +="<a class='item' href='"+url+"?"+params+"&offset=0&limit=50'>50</a>";
  html +="</div></div>&nbsp;&nbsp;条</span>";
  return html;
}

//微信js-api

/**
* @synopsis 签名算法
*
* @param jsapi_ticket 用于签名的 jsapi_ticket
* @param url 用于签名的 url ，注意必须与调用 JSAPI 时的页面 URL 完全一致
*
* @returns
*/
helper.weixinSign = function (jsapi_ticket, url) {
  var ret = {
    jsapi_ticket: jsapi_ticket,
    nonceStr: createNonceStr(),
    timestamp: createTimestamp(),
    url: url
  };
  var string = raw(ret);
  var jsSHA = require('jssha');
  var shaObj = new jsSHA(string, 'TEXT');
  ret.signature = shaObj.getHash('SHA-1', 'HEX');

  return ret;
};

function createNonceStr () {
  return Math.random().toString(36).substr(2, 15);
};

function createTimestamp () {
  return parseInt(new Date().getTime() / 1000) + '';
};

function raw (args) {
  var keys = Object.keys(args);
  keys = keys.sort()
  var newArgs = {};
  keys.forEach(function (key) {
    newArgs[key.toLowerCase()] = args[key];
  });

  var string = '';
  for (var k in newArgs) {
    string += '&' + k + '=' + newArgs[k];
  }
  string = string.substr(1);
  return string;
};





/**
* 加法运算，避免数据相加小数点后产生多位数和计算精度损失。
*
* @param num1加数1 | num2加数2
*/
helper.numAdd=function(num1, num2) {
  var baseNum, baseNum1, baseNum2;
  try {
    baseNum1 = num1.toString().split(".")[1].length;
  } catch (e) {
    baseNum1 = 0;
  }
  try {
    baseNum2 = num2.toString().split(".")[1].length;
  } catch (e) {
    baseNum2 = 0;
  }
  baseNum = Math.pow(10, Math.max(baseNum1, baseNum2));
  //return (num1 * baseNum + num2 * baseNum) / baseNum;
  return Number(((num1 * baseNum + num2 * baseNum) / baseNum).toFixed(2));
};

/**
* 减法运算，避免数据相减小数点后产生多位数和计算精度损失。
*
* @param num1被减数 | num2减数
*/
helper.numSub=function (num1, num2) {
  var baseNum, baseNum1, baseNum2;
  var precision;// 精度
  try {
    baseNum1 = num1.toString().split(".")[1].length;
  } catch (e) {
    baseNum1 = 0;
  }
  try {
    baseNum2 = num2.toString().split(".")[1].length;
  } catch (e) {
    baseNum2 = 0;
  }
  baseNum = Math.pow(10, Math.max(baseNum1, baseNum2));
  precision = (baseNum1 >= baseNum2) ? baseNum1 : baseNum2;
  return Number(((num1 * baseNum - num2 * baseNum) / baseNum).toFixed(2));
};


/**
* 乘法运算，避免数据相乘小数点后产生多位数和计算精度损失。
*
* @param num1被乘数 | num2乘数
*/
helper.numMulti=function(num1, num2) {
  var baseNum = 0;
  try {
    baseNum += num1.toString().split(".")[1].length;
  } catch (e) {
  }
  try {
    baseNum += num2.toString().split(".")[1].length;
  } catch (e) {
  }
  return Number(num1.toString().replace(".", "")) * Number(num2.toString().replace(".", "")) / Math.pow(10, baseNum);
};

/**
* 除法运算，避免数据相除小数点后产生多位数和计算精度损失。
*
* @param num1被除数 | num2除数
*/
helper.numDiv=function(num1, num2) {
  var baseNum1 = 0, baseNum2 = 0;
  var baseNum3, baseNum4;
  try {
    baseNum1 = num1.toString().split(".")[1].length;
  } catch (e) {
    baseNum1 = 0;
  }
  try {
    baseNum2 = num2.toString().split(".")[1].length;
  } catch (e) {
    baseNum2 = 0;
  }
  with (Math) {
    baseNum3 = Number(num1.toString().replace(".", ""));
    baseNum4 = Number(num2.toString().replace(".", ""));
    return (baseNum3 / baseNum4) * pow(10, baseNum2 - baseNum1);
  }
};



helper.checkVerifyCodeExpired= function(expire){
  if(!expire||isNaN(expire)){
    return true;
  }
  var now_time=new Date().getTime();
  if(expire<now_time){
    return true;
  }else{
    return false;
  }
}

helper.getWithdrawStatusInfo = function(type){
  for(var i in withdraw_status_info){
    var status=withdraw_status_info[i];
    if(status['type']==type){
      return status.tag;
    }
  }
  return "";
}


helper.getRedeemStatusInfo = function(type){
  for(var i in redeem_status_info){
    var status=redeem_status_info[i];
    if(status['type']==type){
      return status.tag;
    }
  }
  return "";
}

//获取连连支付数字码的具体信息
helper.getPaymentRetCodeInfo = function(code){
  for(var i in payment_ret_codes){
    var info=payment_ret_codes[i];
    if(info['code']==code){
      return info['msg'];
    }
  }
  return "";
}


helper.getSafeCardNo = function(card_no){
  if(card_no){
    card_no=card_no.substring(0,4)+"********"+card_no.substring(card_no.length-4,card_no.length);
    return card_no;
  }else{
    return "";
  }
}

helper.getSafeIdNo = function(id_no){
  if(id_no&&id_no.length>0){
    id_no=id_no.substring(0,4)+"****"+id_no.substring(id_no.length-5,id_no.length);
    return id_no;
  }else{
    return "";
  }
}


helper.getSafeMobile = function(mobile){
  if(mobile&&mobile.length>0){
    mobile=mobile.substring(0,3)+"****"+mobile.substring(mobile.length-4,mobile.length);
    return mobile;
  }else{
    return "";
  }
}

//如果日期超过10号，则从下个月10号开始计息，第一付款月如果是当月则利息为0，
helper.getPaytimesInfo=function(investment_period,stages,annual_returns,amount){
  investment_period=parseInt(investment_period);
  stages=parseInt(stages);
  annual_returns=parseFloat(annual_returns);
  amount=parseFloat(amount);
  //计算投资收益
  var receivable_income=((amount*annual_returns)*(investment_period/12)).toFixed(2);
  receivable_income=parseFloat(receivable_income);
  var month_receivable_income=((amount*annual_returns)/12);
  var day_receivable_income=((amount*annual_returns)/12/30);
  var divide=investment_period/stages;
  var data=[];
  var add_income=0;//前期累计支付利息
  var today=getCurrentDay();
  var count_day=addDays(today,1);//计息日
  for(var i=0;i< stages;i++){
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth()+1;
    var day = date.getDate();
    var pay_day = new Date(year+"-"+month+"-"+10);
    //计算每次付款周期内获取的收益。
    var _month_money=numMulti(month_receivable_income,divide);
    var _month_data={};
    var _d;
    if(day>9){
      _d=addMonths(pay_day,i*divide+divide);
    }else{
      _d=addMonths(pay_day,i);
    }
    _month_data['date']=_d.getTime();

    var first_income=0;
    if(i==0){
      var day_diff=getDateDiff(_d,count_day);
      first_income=day_diff*day_receivable_income;
      _month_data['amount']=Number(first_income.toFixed(2));
      add_income+=_month_data['amount'];
    }else{
      _month_data['amount']=Number(_month_money.toFixed(2));
      add_income+=_month_data['amount'];
    }
    data.push(_month_data);
  }
  var last_day=addMonths(count_day,investment_period);
  var _last={
    date:last_day.getTime(),
    amount:numAdd(amount,(receivable_income-add_income))
  };
  data.push(_last);
  return data;
}


helper.getPaytimes=function(investment_period,redemption_mode){
  investment_period=parseInt(investment_period);
  redemption_mode=parseInt(redemption_mode);

  var data=[];
  for(var i=0;i< investment_period;i++){
    var today=getCurrentDay();
    var today_t=addDays(today,redemption_mode);
    var _d=addMonths(today_t,i);
    data.push(_d.getTime());
  }
  return data;
}

helper.getCurrentDay=function(){
  var date = new Date();
  var year = date.getFullYear();
  var month = date.getMonth()+1;
  var day = date.getDate();
  var today = new Date(year+"-"+month+"-"+day);
  return today;
};

helper.addDays=function(date,d){
  date.setDate(date.getDate() + d);
  return date;
};

helper.addMonths=function(date,m){
  var d = date.getDate();
  date.setMonth(date.getMonth() + m);
  if (date.getDate() < d)
  date.setDate(0);
  return date;
};


helper.getDateDiff=function(startDate,endDate){
  var startTime = new Date(Date.parse(startDate)).getTime();
  var endTime = new Date(Date.parse(endDate)).getTime();
  var dates = Math.abs((startTime - endTime))/(1000*60*60*24);
  return  dates;
}

helper.getContractNoSuffix = function(){
  var time1=format_date(new Date(),"MMddhhmmss");
  var time2=(Math.random()+"").substr(2, 3);
  return time1+time2;
}

var https = require('https');
var client_id = 'YXA6iCdkoIdzEeWlY9P_aIPkDQ';
var client_secret = 'YXA6mpVbxbvXLNTx2FbBwaHk_2ZDUbg';

//通用http请求函数
var http_request = function (token,data, path, method, callback) {
  data = data || {};
  method = method || 'GET';

  var postData = JSON.stringify(data);
  var options = {
    host: 'a1.easemob.com',
    path: '/fancytimes/miusiyingshi' + path,
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    }
  };

  var req = https.request(options, function (res) {
    var chunks = [];
    var size = 0;
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      chunks.push(chunk);
      size += chunk.length;
    });
    res.on('end', function () {
      var data = JSON.parse(Buffer.concat(chunks, size).toString());
      if (callback)
      callback(data);
    });
  });

  req.on('error', function (e) {
    console.log('problem with request: ' + e.message);
  });
  req.write(postData);
  req.end();
};

//获取token
helper.get_token = function (callback) {
  var data = {grant_type: 'client_credentials', client_id: client_id, client_secret: client_secret};
  http_request("",data, '/token', 'POST', function (data) {
    callback(data);
  });
};

//注册IM用户[单个]
helper.user_create = function (token,username, password, callback) {
  var data = {username: username, password: password};
  http_request(token, data, '/user', 'POST', function (data) {
    if (callback)
    callback(data);
  })
};

/**
* [获取业务名称]
* @author feixiang
* @id {string} - [当前业务id]
* @sysList {collection} - [业务列表]
*/

helper.get_sys_name = function(id, sysList) {
  for(i in sysList){
    if(String(sysList[i]._id) === String(id)){
      return sysList[i].name
    }
  }
}

/**
* [format second：00分00秒]
* @author feixiang
* @second {string} - [秒]
*/
helper.secondToTime = function(second) {
  var add0 = function (num) {
    return num < 10 ? '0' + num : '' + num;
  };
  var min = parseInt(second / 60);
  var sec = parseInt(second - min * 60);
  return add0(min) + '分' + add0(sec) + '秒';
}

/**
* [get recheck status name 通过状态获取复议审核状态名称]
* @author feixiang
* @second {number}
*/
helper.getRecheckStatus = function(status) {
  var inspectionStatus;
  if (status === 0) {
    inspectionStatus = '未复议'
  } else if (status === 1) {
    inspectionStatus = '已申请'
  } else if (status === 2) {
    inspectionStatus = '已评审'
  } else if (status === 3) {
    inspectionStatus = '已驳回'
  }
  return inspectionStatus
}

/**
* [get qa status name 通过状态获取质检状态名称]
* @author feixiang
* @second {number}
*/
helper.getQaStatusName = function(status) {
  var qaStatus;
  if (status === 0) {
    qaStatus = '未质检'
  } else if (status === 1) {
    qaStatus = '已质检'
  }
  return qaStatus
}

/**
* [通过状态获取质检状态名称]
* @author feixiang
* @user {obj}
*/
helper.getUserRole = function(user) {
  var role = user.role;
  if (role === 'manager') {
    role = '管理员'
  } else if (role === 'worker') {
    role = '质检员'
  } else if (role === 'omni') {
    role = '坐席'
  } else if (role === 'chargeman') {
    role = '质检组长'
  }
  return role
}

/**
* @desc 过滤数组中的空值
* @param array
* @author fanxd
* @return array
*/
helper.clearArray = function(array) {
  for(var i = 0 ;i<array.length;i++)
  {
    if(array[i] == "" || typeof(array[i]) == "undefined")
    {
      array.splice(i,1);
      i= i-1;
    }
  }
  return array;
}
