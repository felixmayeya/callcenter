module.exports = function($) {

	$.get("/tasks", function*(next){
		var self = this;
		var result = {};
		var params = {};
		//将session放入ejs渲染数据中
		self.state.session = self.session;

		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager' || self.session.user.role == 'chargeman')) {
			self.redirect('/login');
			return;
		}


		params["audio_status.manual_inspection_status"]=0;
		params["audio_status.auto_inspection_status"]=1;

		var _params = this.request.query;
		var status = 200;
		var offset = _params.offset ? _params.offset : 0;
		var limit = _params.limit ? _params.limit : config.get("limit");

		var assign_status = _params["assign_status"] ? _params["assign_status"] : "";
		var start_time = _params["from"]?_params["from"] : "";
		var end_time = _params["to"]?_params["to"] : "";
		var system =  _params["system"] ? _params["system"] : "";

		if (assign_status != '') {
			if(assign_status==='all'){
				assign_status = ''
			} else {
				params.assign_status = parseInt(assign_status);
			}
		}
		if (system != '' && system !='all') {
			params.system = system;
		}
		var call_time="";
		if(start_time !='' && end_time !=''){
			params["call_time"] = { "$gte": start_time, "$lt": end_time};
		}
		var userParams = {'role':'worker'};
		if(self.session.user.role == 'chargeman'){
			params.qa_group = self.session.user.user_group;
			userParams = {'role':'worker','user_group':self.session.user.user_group};
		}
		var appModel = this.model("audio");
		yield function(callback) {
			appModel.getRowsCount(params, function(err, count) {
				totalPage = Math.ceil(count / limit);
				appModel.getPagedRows(params, offset, limit, {
					created: -1
				}, function(err, rows) {
					if (err) {
						status = 400;
					} else {
						result = {
							rows: rows,
							assign_status: assign_status,
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
			userModel.getRows(userParams,function(err,row){
				if (!err && row) {
					var userList=row;
					result.userList=userList;
				}
				callback();
			})
		}
		var userGroupModel=this.model("user_group");
		yield function(callback) {
			userGroupModel.getRows({'type':'worker'},function(err,rows){
				if (!err && rows) {
					var groupList=rows;
					result.groupList=groupList;
				}
				callback();
			})
		}
		result.operator=self.session.username;
		result.title =  '手动分配';

		var common = self.library("common");
		result.common = common;
		yield self.render('/tasks/tasks', result);
	});

	$.get("/tasks/timers", function*(next){
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
		var status = 200;
		var offset = _params.offset ? _params.offset : 0;
		var limit = _params.limit ? _params.limit : config.get("limit");
		var taskModel = this.model("task");
		yield function(callback) {
			taskModel.getRowsCount(params, function(err, count) {
				totalPage = Math.ceil(count / limit);
				taskModel.getPagedRows(params, offset, limit, {
					created: -1
				}, function(err, rows) {
					if (err) {
						status = 400;
					} else {
						result = {
							rows: rows,
							offset: offset,
							limit: limit,
							totalPage: totalPage,
						};
					}
					callback();
				});
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
		var usergroupModel = this.model("user_group");
		yield function(callback) {
			usergroupModel.getRows({type:"worker"},function(err, row){
				if (!err && row) {
					var usergroupList=row;
					result.usergroupList=usergroupList;
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
		result.operator=self.session.username;
		result.title =  '自动分配';

		var common = self.library("common");
		result.common = common;
		yield self.render('/tasks/timers', result);
	});

	//创建分配
	$.post("/task/auto_assign", function*(next) {
		var self = this;

		//将session放入ejs渲染数据中
		self.state.session = self.session;

		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}
		var _params = this.request.fields;

		var status = 201;
		var result = {};

		//生成 App Key
		var uuid = require('node-uuid');
		var app_key = uuid();

		//生成 App Secret
		var crypto = require('crypto');
		var md5 = crypto.createHash('md5');
		md5.update(app_key + new Date().getTime(), 'utf8');
		var app_secret = md5.digest('hex');

		_params.app_key = app_key;
		_params.app_secret = app_secret;

		//创建
		yield function(callback) {
			var taskModel = this.model("task");
			var audioModel = this.model("audio");
			taskModel.createRow(_params, function(err, row) {
				if (!err && row) {
					result = {
						app: row
					};
					status = 201;

					var assign_mumber = _params["assign_mumber"] ? _params["assign_mumber"] : "";
					var assign_person = _params["assign_person"] ? _params["assign_person"] : "";
					var date_polt = _params["date_polt"] ? _params["date_polt"] : "";
					var source_system = _params["source_system"] ? _params["source_system"] : "";
					var stat_date = _params["stat_date"] ? _params["stat_date"] : "";
					var end_date = _params["end_date"] ? _params["end_date"] : "";
					var operator= _params["operator"] ? _params["operator"] :"";

					//定时任务，自动开启job，将任务分配给人
					var res = runScheduleBySetTime(date_polt,assign_mumber,assign_person,audioModel,source_system,stat_date,end_date,operator);
					if(res==0){
						console.log("更新失败!");

					}


					//写入 Redis
					self.redis.set(app_key, app_secret, function(err, res){
						callback();
					});
				} else {
					result = "更新失败!";
					status = 400;
					callback();
				}
			});
		};

		this.status = status;
		this.body = result;
	});

	//定时任务，自动开启job，将任务分配给人
	function runScheduleBySetTime(date_polt,assign_mumber,assign_person,audioModel,source_system,stat_date,end_date){

		//将任务分配给人
		var schedule = require('node-schedule');
		var res = 1;

		var schedule_job = schedule.scheduleJob(date_polt+' * * *', function(){
			var _params = {};
			var offset = _params.offset ? _params.offset : 0;
			var limit = _params.limit ? _params.limit : assign_mumber;

			if(source_system !='全部业务'){
				_params.system = source_system;
			}
			if(stat_date !='' && end_date !=''){
				_params["call_time"] = { "$gte": stat_date, "$lt": end_date};
			}
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
						params.assign_person = assign_person.split(",")[yy];
						params.assign_status=1;
						console.log( assign_person.split(",")[yy]+"---"+_id);

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

	//删除
	$.delete("/task/auto_assign/:_id", function*(next) {
		var self = this;

		//将session放入ejs渲染数据中
		self.state.session = self.session;

		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}
		var _id = this.params._id;

		var result = {};

		var taskModel = this.model("task");
		yield function(callback) {

			taskModel.deleteRow({
				_id: _id
			}, function(err, row) {
				if (!err && row) {
					result = {
						system: row
					};
					status = 201;
				} else {
					result = "操作失败!";
					status = 400;
				}
				callback();
			});

		};

		this.status = status;
		this.body = result;
	});
	//编辑
	$.put("/task/auto_assign/:_id", function*(next) {
		var self = this;

		//将session放入ejs渲染数据中
		self.state.session = self.session;

		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}
		var _id = this.params._id;
		var _params = this.request.fields;

		var status = 201;
		var result = {};

		var taskModel = this.model("task");
		yield function(callback) {
			taskModel.findOneAndUpdateRow({
				_id: _id
			}, _params, function(err, row) {
				if (!err && row) {
					result = {
						work: row
					};
					status = 201;
				} else {
					result = "更新失败!";
					status = 400;
				}
				callback();
			});
		};

		this.status = status;
		this.body = result;
	});

	/**
	*@desc 录音分配（分配给质检人员和质检组，分配质检组后由质检组长进行再次分配）
	*@param 分配类型 质检人员 user 、质检组 group
	*@param 分配人员id
	*@param 分配人员名称
	*@param 开始日期
	*@param 完成日期
	*/
	$.put("/task/assign/", function*(next) {
		var self = this;
		var status = 200;
		var result = {};
		var params = {};
		//将session放入ejs渲染数据中
		self.state.session = self.session;

		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager' || self.session.user.role == 'chargeman')) {
			self.redirect('/login');
			return;
		}

		var _params = this.request.fields;

		var ids = _params["ids"].split(",");
		//分配类型 user 质检人员  group 质检组
		var qa_type = _params["qa_type"] ? _params["qa_type"] : "";
		//分配人员
		var qa_person = _params["qa_person"] ? _params["qa_person"] : "";
		//分配人员名字
		var assign_to = _params["assign_to"] ? _params["assign_to"] : "";
		//开始日期
		var start_date = _params["start_date"] ? _params["start_date"] : "";
		//完成日期
		var completed_date = _params["completed_date"] ? _params["completed_date"] : "";

		if(qa_type === "user"){
			params["qa_person"] = qa_person;
			params["assign_to"] = assign_to;
			//分配状态改为1已分配
			params["assign_status"] = 1;
		}else{
			params["qa_group"] = qa_person;
			params["assign_status"] = 3;
		}

		params["start_date"] = start_date;
		params["completed_date"] = completed_date;

		var audioModel = this.model("audio");
		yield function(callback) {
			for(var i=0;i<ids.length;i++){
				audioModel.findOneAndUpdateRow({
					_id: ids[i]
				}, params, function(err, row) {
					if (!err && row) {
						result = {
							work: row
						};
					} else {
						result = "更新失败!";
						status = 400;
					}
					callback();
				});
			}
		};

		this.status = status;
		this.body = result;
	});

	//不予分配
	$.put("/task/assign/undis", function*(next) {
		var self = this;
		var status = 200;
		var result = {};
		var params = {};
		//将session放入ejs渲染数据中
		self.state.session = self.session;

		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}

		var _params = this.request.fields;

		var ids = _params["ids"].split(",");
		//分配状态修改为2不予分配
		params["assign_status"] = 2;
		var audioModel = this.model("audio");
		yield function(callback) {
			for(var i=0;i<ids.length;i++){
				audioModel.findOneAndUpdateRow({
					_id: ids[i]
				}, params, function(err, row) {
					if (!err && row) {
						result = {
							work: row
						};
 					} else {
						result = "更新失败!";
						status = 400;
					}
					callback();
				});
			}
		};

		this.status = status;
		this.body = result;
	});

	//录音召回 把已经分配的录音，重新该车未分配状态
	$.put("/task/assign/redis", function*(next) {
		var self = this;

		//将session放入ejs渲染数据中
		self.state.session = self.session;

		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager' || self.session.user.role == 'chargeman')) {
			self.redirect('/login');
			return;
		}
		var status = 201;
		var result = {};
		var params = {};
		var _params = this.request.fields;
		var ids = _params["ids"].split(",");

		if(self.session.user.role==="chargeman"){
			params["qa_group"] = self.session.user.user_group;
			params["qa_person"] = '';
			params["start_date"] = '';
			params["completed_date"] = '';
			params["assign_status"] = 3;
		}else{
			//分配状态修改为0未分配
			params["qa_person"] = '';
			params["start_date"] = '';
			params["completed_date"] = '';
			params["assign_status"] = 0;
		}

		var audioModel = this.model("audio");
		yield function(callback) {
			for(var i=0;i<ids.length;i++){
				audioModel.findOneAndUpdateRow({
					_id: ids[i]
				}, params, function(err, row) {
					if (!err && row) {
						result = {
							work: row
						};
						status = 201;
					} else {
						result = "更新失败!";
						status = 400;
					}
					callback();
				});
			}
		};

		this.status = status;
		this.body = result;
	});

}
