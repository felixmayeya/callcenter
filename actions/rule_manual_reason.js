/**
* @desc 人工质检评分原因
* @author fanxd
*/
module.exports = function($) {

	/**
	* @desc 查询人工质检评分原因列表
	* @param offset 当前页数
	* @param limit 每页记录条数
	* @param name 词组名称，支持模糊查询
	* @author fanxd
	*/
	$.get("/rules/manual/reason", function *(next) {
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
		var status = 201;
		var offset = _params.offset ? _params.offset : 0;
		var limit = _params.limit ? _params.limit : config.get("limit");

		var name = _params["name"] ? _params["name"] : "";
		if (name != '') {
			params.name = new RegExp(name, 'i');
		}
		var ruleManualReasonModel = this.model("rule_manual_reason");
		var totalPage={};
		yield function(callback) {
			ruleManualReasonModel.getRowsCount(params, function(err, count) {
				if(!err){
					totalPage = Math.ceil(count / limit);
				}
				callback();
			});
		}

		yield function(callback) {
			ruleManualReasonModel.getPagedRows(params, offset, limit, {
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
						totalPage: totalPage
					};
				}
				callback();
			});
		}

		var common = self.library("common");
		result.common = common;
		result.title = '人工质检评分原因';

		yield self.render('rules/manual_reason', result);

	});


	/**
	*@desc 根据id添加人工评分原因
	*@param id
	*@author fanxd
	*/
	$.post("/rules/manual/reason", function *(next) {
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}
		var params = this.request.fields;
		params.username=self.session.user.username;
		var status = 200;
		var result = {};
		var ruleManualReasonModel = this.model("rule_manual_reason");
		yield function(callback) {
			ruleManualReasonModel.createRow(params, function(err, row) {
				if (!err && row) {
					result = {
						app: row
					};
				} else {
					result = "添加人工质检评分原因失败!";
					status = 400;
				}
				callback();
			});
		};
		this.status = status;
		this.body = result;
	});


	/**
	*@desc 根据id修改编辑人工评分原因
	*@param id
	*@author fanxd
	*/
	$.put("/rules/manual/reason/:id", function *(next) {
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}
		var params = {
			_id:this.params.id
		}
		var result = {};
		var status = 200;
		var _params = this.request.fields;
		_params.username=self.session.user.username;
		var ruleManualReasonModel = this.model("rule_manual_reason");
		yield function(callback) {
			ruleManualReasonModel.findOneAndUpdateRow(params, _params, function(err, row) {
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


	/**
	*@desc 根据id删除人工评分原因
	*@param id
	*@author fanxd
	*/
	$.delete("/rules/manual/reason/:id", function *(next) {
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}
		var params = {
			_id:this.params.id
		}
		var status = 200;
		var result = {};
		var ruleManualReasonModel = this.model("rule_manual_reason");
		yield function (callback) {
			ruleManualReasonModel.deleteRow(params, function(err, row) {
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
	* @desc 验证人工评分原因名称是否存在
	* @param name 人工评分原因名称（精确查询）
	* @author fanxd
	*/
	$.get("/rules/manual/reason/validate/:name", function *(next) {
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}
		var params = {
			name : this.params.name
		};
		var result = {};
		var status = 200;

		var ruleManualReasonModel = this.model("rule_manual_reason");
		yield function(callback) {
			ruleManualReasonModel.getRowsCount(params,function(err,count){
				if(err){
					status = 400;
					result="验证人工评分原因名称失败";
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


}
