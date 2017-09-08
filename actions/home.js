module.exports = function($) {

  //首页面任务进度统计
  $.get("/home/task_process", function*(next){
        var self = this;
		
	
		var params = {};
	
		if(name!=''){
			params["upload_audio.upload_audio_name"] = name;
		}

		
		var audioModel = this.model("audio");
		yield function(callback){
			audioModel.getRowsCount(params,function(err,count){
				if(err){
					status = 400;
					result="验证上传文件名失败";
				}else{
					
				}
				callback();
			});
		}
	

  });

}

