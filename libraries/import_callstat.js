var helper = module.exports = {}


/**
*@desc 读取csv文件导入话单数据
*@param 文件路径（包含文件名称）
*@author fanxd
*/
helper.importCallStat = function(filePath){
  var fs = require("fs");

  var paramss = [];
  if(fs.existsSync(filePath)){
    var data = fs.readFileSync(filePath);

    data = data.toString();
    var table = new Array();
    var rows = new Array();
    rows = data.split("\n");
    for (var i = 0; i < rows.length-1; i++) {
      table.push(rows[i].split(","));
    }

    var n = table[0].length;
    for(var i = 1;i<table.length;i++){
      var params ={};
      for(var j=0;j<n;j++){
        if(table[0][j] === "录音流水号"){
          params.seq=table[i][j]
        }
        if(table[0][j] === "座席工号"){
          params.sit_number=table[i][j]
        }
        if(table[0][j] === "来电号码"){
          params["customer.mobile"]=table[i][j]
        }
        if(table[0][j] === "呼叫时间"){
          if(!isNaN(table[i][j])){
            var time = table[i][j].substr(0,4)+"-"+table[i][j].substr(4,2)+"-"+table[i][j].substr(6,2)+" "+table[i][j].substr(8,2)+":"+table[i][j].substr(10,2)+":"+table[i][j].substr(12,2);
            params.call_time=Number(new Date(time).getTime())
          }
        }
        if(table[0][j] === "接入系统"){
          params.system=table[i][j]
        }
        if(table[0][j] === "客户名称"){
          params["customer.name"]=table[i][j]
        }
        if(table[0][j] === "文件路径"){
          var filePath = table[i][j];
          var fileName = filePath.split("/").pop();
          params["upload_audio.upload_audio_name"] = fileName;
          params["upload_audio.upload_audio_type"] = 0;
          params.radio_path = filePath;
        }
        params["audio_status.upload_status"] = 1
        params["audio_status.conver_status"] = 1
      }
      paramss.push(params);
    }
  }else {
    console.log("no such file or directory");
  }

  return paramss;
}

/**
*@desc 读取csv文件导入用户
*@param 文件路径（包含文件名称）
*@param items   用户配置的批量导入表头信息
*@author fanxd
*/
helper.importUser = function(filePath,items){
  var fs = require("fs");

  var paramss = [];
  if(fs.existsSync(filePath)){
    var data = fs.readFileSync(filePath);

    data = data.toString();
    var table = new Array();
    var rows = new Array();
    rows = data.split("\n");
    for (var i = 0; i < rows.length-1; i++) {
      table.push(rows[i].split(","));
    }

    var n = table[0].length;
    for(var i = 1;i<table.length;i++){
      var params ={};
      for(var j=0;j<n;j++){
        // if(table[0][j] === "座席姓名"){
        //   params.username=table[i][j]
        // }
        // if(table[0][j] === "座席工号"){
        //   params.sit_number=table[i][j]
        // }
        // if(table[0][j] === "班组信息"){
        //   params.user_group=table[i][j]
        // }
        if(table[0][j] === items.username){
          params.username=table[i][j];
        }
        if(table[0][j] === items.password){
          params.password=table[i][j];
        }
        if(table[0][j] === items.sit_number){
          params.sit_number=table[i][j];
        }
        if(table[0][j] === items.user_group){
          params.user_group=table[i][j];
        }

      }
      //typeof(b) != 'object'
      if(JSON.stringify(params) != "{}"){
        paramss.push(params);
      }
    }
  }else {
    console.log("no such file or directory");
  }

  return paramss;
}



/**
*@desc 根据用户设定对接字段，读取csv文件导入话单数据
*@param 文件路径（包含文件名称）
*@author fanxd
*/
helper.importCallStats = function(file,item){
  console.log(file);
  var fs = require("fs");
  var paramss = [];
  var data = fs.readFileSync(file);
  data = data.toString();
  console.log(data);
  var table = new Array();
  var rows = new Array();
  rows = data.split("\n");
  for (var i = 0; i < rows.length-1; i++) {
    table.push(rows[i].split(","));
  }
  var n = table[0].length;

  for(var i = 1;i<table.length;i++){
    var params ={};
    for(var j=0;j<n;j++){
      if(item.item_seq && table[0][j] === item.item_seq){
        params.seq=table[i][j]
      }
      if(item.item_sit_number && table[0][j] === item.item_sit_number){
        params.sit_number=table[i][j]
      }
      if(item.item_mobile && table[0][j] === item.item_mobile){
        params["customer.mobile"]=table[i][j]
      }
      if(item.item_call_time && table[0][j] === item.item_call_time){
        if(!isNaN(table[i][j])){
          var time = table[i][j].substr(0,4)+"-"+table[i][j].substr(4,2)+"-"+table[i][j].substr(6,2)+" "+table[i][j].substr(8,2)+":"+table[i][j].substr(10,2)+":"+table[i][j].substr(12,2);
          params.call_time=Number(new Date(time).getTime())
        }
      }
      if(item.item_audio_path && table[0][j] === item.item_audio_path){
        var filePath = table[i][j];
        if(filePath != undefined){
          var fileName = filePath.split("/").pop();
          params["upload_audio.upload_audio_name"] = fileName;
          params["upload_audio.upload_audio_type"] = 0;
        }

        params.radio_path = filePath;
      }
      if(item.item_custom_id && table[0][j] === item.item_custom_id){
        params["customer.id"]=table[i][j]
      }
      if(item.item_customer_name && table[0][j] === item.item_customer_name){
        params["customer.name"]=table[i][j]
      }
      if(item.item_end_comment && table[0][j] === item.item_end_comment){
        params.end_comment=table[i][j]
      }
      if(item.item_satisfy_comment && table[0][j] === item.item_satisfy_comment){
        params.satisfy_comment=table[i][j]
      }
      if(item.item_call_duration && table[0][j] === item.item_call_duration){
        params.call_duration=table[i][j]
      }
      if(item.item_sit_team && table[0][j] === item.item_sit_team){
        params.sit_team=table[i][j]
      }
      if(item.item_channel && table[0][j] === item.item_channel){
        params.channel=table[i][j]
      }

    }
    if(JSON.stringify(params) != "{}"){
      params["audio_status.upload_status"] = 1
      paramss.push(params);
    }
  }
  return paramss;
}

/**
*@desc 根据用户设定对接字段，读取JSON文件导入话单数据
*@param 文件路径（包含文件名称）
*/
helper.importJSONStats = function(file,item){
  var fs=require('fs');
  var result = JSON.parse(fs.readFileSync(file));
  var paramss = [];
  for(var i = 0; i< result.length; i++){
    var params ={};
    params.seq = result[i][item.item_seq];
    params.sit_number = result[i][item.item_sit_number];
    params["customer.mobile"] = result[i][item.item_mobile];
    params.call_time = result[i][item.item_call_time];
    params.system = result[i][item.item_system];
    params["customer.id"] = result[i][item.item_customer_id];
    params["customer.name"] = result[i][item.item_customer_name];
    params.end_comment = result[i][item.item_end_comment];
    params.satisfy_comment = result[i][item.item_satisfy_comment];
    params.call_duration = result[i][item.item_call_duration];
    params.sit_team = result[i][item.item_sit_team];
    params.channel = result[i][item.item_channel];
    params.mute_ratio = result[i][item.item_mute_ratio];
    params.customer_speed = result[i][item.item_customer_speed];
    params.agent_speed = result[i][item.item_agent_speed];
    params.mute_duration = result[i][item.item_mute_duration];
    paramss.push(params);
  }
  return paramss;
}

/**
*@desc 根据用户设定对接字段，读取JSON文件导入话单数据
*@param 文件路径（包含文件名称）
*/
helper.importXMLStats = function(file,item){

  var fs=require('fs');
  var paramss = [];
  var data = fs.readFileSync(file);
  var select = require('xpath.js'),
  dom = require('xmldom').DOMParser

  var doc = new dom().parseFromString(data.toString());
  var result = select(doc, "//items//item");
  for(var i = 0; i< result.length; i++){
    var params ={};
    params.seq = result[i].getElementsByTagName(item.item_seq)[0].firstChild.nodeValue;
    params.sit_number = result[i].getElementsByTagName(item.item_sit_number)[0].firstChild.nodeValue;
    params["customer.mobile"] = result[i].getElementsByTagName(item.item_mobile)[0].firstChild.nodeValue;
    params.call_time = result[i].getElementsByTagName(item.item_call_time)[0].firstChild.nodeValue;
    params.system = result[i].getElementsByTagName(item.item_system)[0].firstChild.nodeValue;
    params["customer.id"] = result[i].getElementsByTagName(item.item_customer_id)[0].firstChild.nodeValue;
    params["customer.name"] = result[i].getElementsByTagName(item.item_customer_name)[0].firstChild.nodeValue;
    params.end_comment = result[i].getElementsByTagName(item.item_end_comment)[0].firstChild.nodeValue;
    params.satisfy_comment = result[i].getElementsByTagName(item.item_satisfy_comment)[0].firstChild.nodeValue;
    params.call_duration = result[i].getElementsByTagName(item.item_call_duration)[0].firstChild.nodeValue;
    params.sit_team = result[i].getElementsByTagName(item.item_sit_team)[0].firstChild.nodeValue;
    params.channel = result[i].getElementsByTagName(item.item_channel)[0].firstChild.nodeValue;
    params.mute_ratio = result[i].getElementsByTagName(item.item_mute_ratio)[0].firstChild.nodeValue;
    params.customer_speed = result[i].getElementsByTagName(item.item_customer_speed)[0].firstChild.nodeValue;
    params.agent_speed = result[i].getElementsByTagName(item.item_agent_speed)[0].firstChild.nodeValue;
    params.mute_duration = result[i].getElementsByTagName(item.item_mute_duration)[0].firstChild.nodeValue;
    paramss.push(params);
  }
  return paramss;

}
