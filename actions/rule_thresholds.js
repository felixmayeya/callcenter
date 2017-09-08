/**
*@desc 阈值增删改查维护操作
*@author fanxd
*/
module.exports = function($) {

	//获取阈值管理

	$.get("/rules/thresholds", function *(next) {
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}
		var _params = this.request.query;
		var params = {};
		var result = {};
		var status = 200;
		var offset = _params.offset ? _params.offset : 0;
		var limit = _params.limit ? _params.limit : config.get("limit");

		var name = _params["name"] ? _params["name"] : "";
		if (name != '') {
			params.name = new RegExp(name, 'i');
		}
		var appModel = this.model("rule_threshold");
		var systemModel = this.model("system");
		var systems={};
		var totalPage={};

		yield function(callback) {
			systemModel.getColumnRows({},{"name":1}, function(err, row) {
				if (!err && row) {
 					systems = row;
				}else {
					status = 404;
				}
				callback();
			});
		}

		yield function(callback) {
			appModel.getRowsCount(params, function(err, count) {
				if(!err){
					totalPage = Math.ceil(count / limit);
				}
				callback();
			});
		}

		yield function(callback){
			appModel.getPagedRows(params, offset, limit, {
				created: -1
			}, function(err, rows) {
				if (err) {
					status = 400;
				} else {
					result = {
						conts: rows,
						name: name,
						offset: offset,
						limit: limit,
						totalPage: totalPage,
						systems:systems,
						thresholds:config.get("thresholds")
					}
				}
				callback();
			});
		}

		result.title = '阈值设置';

		var common = self.library("common");
		result.common = common;
		yield self.render('rules/thresholds', result);
	})

	//添加阈值
	$.post("/rules/thresholds", function *(next) {
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}
		var status = 200;
		var result = {};
		var _params = this.request.fields;


		var thresholdsJson= {};
		var thresholds = config.get("thresholds");
		thresholds.forEach(function(threshold){
			 thresholdsJson[threshold.code] = threshold.value
		 })
 		 _params.name = thresholdsJson[_params["code"]];

		yield function(callback) {
			var appModel = this.model("rule_threshold");
			appModel.createRow(_params, function(err, row) {
				if (!err && row) {
					result = {
						app: row
					};
 				} else {
					result = "添加阈值失败!";
					status = 400;
				}
				callback();
			});
		};
		this.status = status;
		this.body  = result;
	});

	//修改阈值
	$.put("/rules/thresholds/:id", function *(next) {
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}
		var id = this.params.id;
		var _params = this.request.fields;
		var status = 200;
		var result = {};
		var appModel = this.model("rule_threshold");
		yield function(callback) {
			appModel.findOneAndUpdateRow({
				_id: id
			}, _params, function(err, row) {
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
		};

		this.status = status;
		this.body = result;
	});

	//删除阈值
	$.delete("/rules/thresholds/:id", function *(next) {
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}
		var id = this.params.id;
		var result = {};
		var status = 200;
		var appModel = this.model("rule_threshold");
		yield function(callback) {
			appModel.deleteRow({
				_id: id
			}, function(err, row) {
				if (!err && row) {
					result = {
						app: row
					};
 				} else {
					result = "操作失败!";
					status = 400;
				}
				callback();
			});
			this.status = status;
			this.body = result;
		}
	});

	/**
	*@desc 验证阀值是否已设置
	*@param system 系统
	*@param name 繁殖名称
	*@author fanxd
	*/
	$.get("/rules/thresholds/validate/:system/:name", function *(next) {
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}

		var _params = this.request.query;
		var result = {};
		var status = 200;

		var params = {};
		var name = this.params.name;
		if (name != '') {
			params.name = name;
		}
		var system = this.params.system;
		if (system != '') {
			params.system = system;
		}

		var ruleThresholdModel = this.model("rule_threshold");
		yield function(callback){
			ruleThresholdModel.getRowsCount(params,function(err,count){
				if(err){
					status = 400;
					result="验证规则集名称失败";
				}else{
					if(count<1){
						result = {
							status : 20000
						}
					}else if(count>1){
						result={
							status :20002
						}
					}else{
						result={
							status :20001
						}
					}
				}
				callback();
			});
		}

		this.status = status;
		this.body = result;
	});



	/**
	*@desc 阈值状态变更
	*@param status  状态 1 启用 0 禁用
	*@author fanxd
	*/
	$.put("/rules/thresholds/change/status/:id",function*(next){
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}
		var status = this.request.fields.status;

		var status = 200;
		var result = [];

		var ruleThresholdModel = this.model("rule_threshold");
		yield function(callback){
			ruleThresholdModel.findOneAndUpdateRow({ _id : this.params.id },{status:status},function(err,row){
				if(!err && row){
					stauts = 200;
					result={
						stauts:20000
					}
				}else{
					status =400;
					result="修改阈值状态失败";
				}
				callback();
			});
		}

		this.status = status;
		this.body = result;
	});
}
