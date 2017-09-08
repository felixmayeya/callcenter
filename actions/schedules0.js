/**
*@desc 任务进度（录音上传--> 录音转换 ---> 智能检测 ---> 人工检测）
*@author fanxd
*/
module.exports = function($) {


	$.get("/tasks/schedules0", function*(next){
		var self = this;
 		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}
		var result = {};
		var params = {};

		var _params = this.request.query;

		var status = 201;
		var offset = _params.offset ? _params.offset : 0;
		var limit = _params.limit ? _params.limit : config.get("limit");

		var audio_status = _params["audio_status"] ? _params["audio_status"] : "";
		var assign_status = _params["assign_status"] ? _params["assign_status"] : "";

		var start_time = _params["startTime"]? _params["startTime"]  : "";
		var end_time = _params["endTime"]? _params["endTime"] : "";
		var system = _params["system"] && _params["system"]!== "all" ? _params["system"] : "";


		if (assign_status != '') {
			params.assign_status = parseInt(assign_status);
		}

		if(audio_status == 1){
			params["audio_status.upload_status"] = 1;
		}else if (audio_status==2) {
			params["audio_status.conver_status"] = 1;
		}else if (audio_status==3) {
			params["audio_status.auto_inspection_status"] = 1;
		}else if (audio_status==4) {
			params["audio_status.manual_inspection_status"] = 1;
		}

		if (system != '') {
			params.system = system;
		}
		var call_time="";
		if(start_time !='' && end_time !=''){
			params["call_time"] = { "$gte": parseInt(start_time), "$lt": parseInt(end_time)};
		}
		var appModel = this.model("audio");
		var totalPage = {};
		yield function(callback) {
			appModel.getRowsCount(params, function(err, count) {
				totalPage = Math.ceil(count / limit);
				callback();
			});
		}

		yield function(callback) {
			appModel.getPagedRows(params, offset, limit, {
				created: -1
			}, function(err, rows) {
				if (err) {
					status = 400;
				} else {
					result = {
						rows: rows,
						audio_status:audio_status,
						assign_status:assign_status,
						start_time:start_time,
						end_time:end_time,
						system:system,
						offset: offset,
						limit: limit,
						totalPage: totalPage,
					};
				}
				callback();
			});
		}


		var systemModel = this.model("system");
		yield function(callback) {
			systemModel.getRows({}, function(err, row) {
				if (!err && row) {
					status = 200;
					var systemList = row;
					result.systemList=systemList;
				}
				callback();
			})
		}
		var userModel=this.model("user");
		yield function(callback) {
			userModel.getRows({'role':'worker'},function(err,row){
				if (!err && row) {
					var userList=row;
					result.userList=userList;
				}
				callback();
			})
		}

		result.title =  '任务进度';
		
		result.common = self.library("common");
		yield self.render('/tasks/schedules0', result);
	});


}
