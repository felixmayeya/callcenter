module.exports = function($) {
  //自动任务分配的JOB；需要通过访问浏览器以下路径开启；如：...shedule/start_job/1；
  $.get("/shedule/start_job/:_id", function*(next){
	  
	    var schedule = require('node-schedule');
	    var schedule_job  = "";
	    var flag= this.params._id;
		var audioModel = this.model("audio");
		
		if(flag==1){
			  
			  var _params = this.request.query;
			  var status = 200;
			  var taskModel = this.model("task");
		
			  yield function(callback) {
				  
				schedule.scheduleJob('call_daemon_job','30 * * * * *', function(){
			    console.log('start the daemon job..............:' + new Date());
			  
				  
				//如果某自动分配规则被删除，则也需要删除自动执行的定时任务
				var all_jobs = schedule.scheduledJobs;
				for(var i in all_jobs) {
					var job = all_jobs[i];
					
					if(job.name != "call_daemon_job" && job.name != "auto_import_data"){
						var result = schedule.cancelJob(job.name);
					    console.log("stop job name is..........:"+job.name);
					}
					
				}
				  
				var runnlingJobs = {};
				_params.plan_status=1;
			    taskModel.getRows(_params, function(err, rows) {
				  if (!err && rows) {
					  for (var i in rows) {
						
						var row = rows[i];
						
						var _id = row["_id"];
						var assign_mumber = row["assign_mumber"];  
						var assign_person = row["assign_person"];    
						var date_polt = row["date_polt"];
						var source_system = row["source_system"];
						var stat_date = row["stat_date"];
						var end_date = row["end_date"];
						var operator = row["operator"];
						
						//定时任务，自动开启job，将任务分配给人
						var res = runScheduleBySetTime(_id,schedule,date_polt,assign_mumber,assign_person,audioModel,source_system,stat_date,end_date,operator);
						
						if(res==0){
							console.log("更新失败!");
						}
					  }
		
				} else {
				  status = 400;
				}
				  callback();
			  });
			  
			  });
			}
		}else if(flag==0){
			var all_jobs = schedule.scheduledJobs;
			for(var i in all_jobs) {
				var job = all_jobs[i];
				schedule.cancelJob(job.name);
				console.log("stop all running job ..........:"+result);	
			}
			
		}
  });

//自动话数据导入的JOB；需要通过访问浏览器以下路径开启；如：...shedule/import_job/1；
  $.get("/shedule/import_job/:_id", function*(next){
	    var flag= this.params._id;
	    var self = this;
		if(flag==1){
			  var schedule = require('node-schedule');
			  var schedule_job  = "";
			  var importModel=self.model("import_config");
			  var audioModel=this.model("audioTest");
			  var appModel2 = this.model("import");
			  var importCallstat = self.library("import_callstat");
			  var fs = require("fs");
			  yield function(callback) {
			  schedule.scheduleJob('import_daemon_job','30 * * * * *', function(){
			 
			  var status = 200
			  var result = {};
			  var _params = {};
			  _params.upload_type=1;
			  importModel.getRow(_params, function(err, row) {
			      if (!err && row) {
			    	result = row;
			        var item = result["items"];
			        schedule.scheduleJob("import_data_job",result.item_auto_time+' * * *', function(){
			        	//调用导入数据的方法
			        	var url = "/import/csv";
			            var data = {};
			            var items = {};
			            var datas  = {};
			        	  request({
			        	      url: url,
			        	      method: "POST",
			        	      json: true,
			        	      headers: {
			        	        "content-type": "application/json",
			        	      },
			        	      body: data
			        	    }, function(error, response, body) {
			        	      if (!error && response.statusCode == 200) {
			        	        console.log("请求成功");
			        	        datas = response.body;
			        	      }else{
			        	        console.log(error);
			        	      }
			        	    });
			        });
					  
			      } else {
			        status = 400;
			      }
			      callback();
			    });
			  
			  
			 });
			  }
			
		}else if(flag==0){
			var all_jobs = schedule.scheduledJobs;
			for(var i in all_jobs) {
				var job = all_jobs[i];
				schedule.cancelJob(job.name);
			}
		}
});
  

//监控拷贝文件
  $.get("/shedule/copy_check/:_id", function*(next){
	    var flag= this.params._id;
	    var self = this;
		if(flag==1){
			  var schedule = require('node-schedule');
			  var importModel=self.model("import_config");
			  var fs = require("fs");
			  
			  yield function(callback) { 
			  schedule.scheduleJob('import_daemon_job','10 * * * * *', function(){
		      
			  console.log('start the file copy check daemon job..............:' + new Date());
			  var status = 200
			  var result = {};
			  var _params = {};
			  importModel.getRow(_params, function(err, row) {
			      if (!err && row) {
			    	result = row;
					var files_path_f = result.files_path;
					var radio_path_f = result.radio_path;
					var config = require('config');
					var file_path_t = config.get('upload_voice_path')
					
					//源文件下的文件的总计大小；
					var filesSize_f = getFileTotalSize(radio_path_f);
					//源文件下的文件的总计大小；
					var filesSize_t = getFileTotalSize(file_path_t);
					console.log(filesSize_f+'.....file total size.....:' + filesSize_t);
					
					if(filesSize_f == filesSize_t){
						  //执行调用语音引擎的脚本
						  var exec = require('child_process').exec;
					      exec(config.get('conver_voice_shell')+" "+config.get('upload_voice_path')+" "+config.get('conver_xml_path'), function(err,stdout,stderr){
					      if(err) {
					    	  console.log(stderr);
					      } else {
					    	  console.log("成功"+stdout);
					    	  //导入完毕，删除原目录的所有音频文件
					  	      var fsd = require( 'fs' );
					  	      fsd.unlink(radio_path_f,callback);
					      }
					    });
					}
					  
			      } else {
			        status = 400;
			      }
			      callback();
			    });
			  
			  
			 });
			  }
			
		}else if(flag==0){
			var all_jobs = schedule.scheduledJobs;
			for(var i in all_jobs) {
				var job = all_jobs[i];
				schedule.cancelJob(job.name);
			}
		}
});
  

	/*
	* 复制目录中的所有文件包括子目录
	* @param{ String } 需要复制的目录
	* @param{ String } 复制到指定的目录
	*/
	var fs = require( 'fs' ),
	stat = fs.stat;
	var copy = function( src, dst ){
	// 读取目录中的所有文件/目录
	fs.readdir( src, function( err, paths ){
	    if( err ){
	        throw err;
	    }
	    paths.forEach(function( path ){
	        var _src = src + '/' + path,
	            _dst = dst + '/' + path,
	            readable, writable;       
	        stat( _src, function( err, st ){
	            if( err ){
	                throw err;
	            }
	            // 判断是否为文件
	            if( st.isFile() ){
	                // 创建读取流
	                readable = fs.createReadStream( _src );
	                // 创建写入流
	                writable = fs.createWriteStream( _dst );   
	                // 通过管道来传输流
	                readable.pipe( writable );
	            }
	            // 如果是目录则递归调用自身
	            else if( st.isDirectory() ){
	                exists( _src, _dst, copy );
	            }
	        });
	    });
	});
	};
	//在复制目录前需要判断该目录是否存在，不存在需要先创建目录
	var exists = function( src, dst, callback ){
	fs.exists( dst, function( exists ){
	    // 已存在
	    if( exists ){
	        callback( src, dst );
	    }
	    // 不存在
	    else{
	        fs.mkdir( dst, function(){
	            callback( src, dst );
	        });
	    }
	});
	};

	//遍历读取文件，获取文件总计大小
	function getFileTotalSize(path)
	{
	   var totalSize = 0;
	   files = fs.readdirSync(path);//需要用到同步读取
	   files.forEach(walk);
	   function walk(file)
	   {  
	        states = fs.statSync(path+'/'+file);         
	        //创建一个对象保存信息
	        var obj = new Object();
	        var size = states.size;//文件大小，以字节为单位
	        totalSize += parseInt(size);
	    }
	   return totalSize;
	}
}


   //定时任务，自动开启job，将任务分配给人
  function runScheduleBySetTime(_id,schedule,date_polt,assign_mumber,assign_person,audioModel,source_system,stat_date,end_date,operator){

	   //将任务分配给人
	  var res = 1;
	  var date_cron = date_polt.split(':')[2]+" "+date_polt.split(':')[1]+" "+date_polt.split(':')[0] ;
	  console.log("readly to start job name is..........:"+"callcenter_"+_id+"----cron_datepolt:"+date_cron);
	 
  	  var schedule_job = schedule.scheduleJob("callcenter_"+_id,date_cron+' * * *', function(){
		
	  var _params = {};
	  
	  if(source_system !='全部业务'){
			_params.system = source_system;
	  }
	  if(stat_date !='' && end_date !=''){
			_params["call_time"] = { "$gte": stat_date, "$lt": end_date};
	  }
      
	  //只查询未分配状态的任务
	  _params.assign_status=0;
	  
      audioModel.getRows(_params, function(err, rows) {
		  
          if (err) {
            status = 0;
          } else {
				 result = {
                  rows: rows
                 };
				 
				  var qa_size = assign_person.split(",").length;
				  var total_row = "";
				  
				  //如果实际任务大于 质检员 * 没人质检条数，则实际任务数，按照后者计算；
				  if(rows.length > parseInt(qa_size) * parseInt(assign_mumber)){
					  total_row = parseInt(qa_size) * parseInt(assign_mumber);
				  }else{
					  total_row = rows.length
				  }
					 //循环将任务对应到人
					  for(var xx=0; xx < total_row; xx++){
						  
						//平均分配
						var yy = xx % qa_size;
						var _id = rows[xx]._id;
						var params = {};
						
					
						params.qa_person = assign_person.split(",")[yy];
						params.assign_to =  operator;
						params.assign_status = 1;
					
					    console.log("task dispath result: "+schedule_job.name+"---"+assign_person.split(",")[yy]+"---"+_id);
						
						//将相任务和质检员信息更新到对应的db
						audioModel.findOneAndUpdateRow({
							_id: _id
						}, params, function(err, row) {
						if (!err && row) {
							status = 0;
						} else {
							status = 0;
						}

						});
								
					   }
			
				  }

        });
	 });
	  return res;
}
  
