/**
*@desc 标准话术增删改查维护操作
*@author fanxd
*/
module.exports = function($) {

	// 获取阈值管理
	$.get("/rules/tricks", function *(next) {
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}
		var appModel = this.model("rule_trick");
		var _params = this.request.query;
		var result = {};
		var status = 200;
		var offset = _params.offset ? _params.offset : 0;
		var limit = _params.limit ? _params.limit : config.get("limit");
		var params = {};
		var name = _params["name"] ? _params["name"] : "";
		if (name != '') {
			params.name = new RegExp(name, 'i');
		}
		var totalPage={};
		yield function(callback) {
			appModel.getRowsCount(params, function(err, count) {
				totalPage = Math.ceil(count / limit);
			});
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
						totalPage: totalPage
					};
				}
				callback();
			});
		}
		result.title = '标准话术';
		
		var common = self.library("common");
		result.common = common;
		yield self.render('/rules/tricks', result);
	})

	// 添加话术管理
	$.post("/rules/tricks", function *(next) {
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}
		var result = {};
		var _params = this.request.fields;
		_params.username = self.session.user.username;
		var appModel = this.model("rule_trick");
		yield function(callback) {
			appModel.createRow(_params, function(err, row){
				if (!err && row) {
					result = {
						app: row
					};
					status = 201;
				} else {
					result = "标准话术管理!";
					status = 400;
				}
				callback();
			});
		};
		this.status = status;
		this.body = result;
	});

	// 修改话术管理
	$.put("/rules/tricks/:id", function *(next) {
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}
		var _params = this.request.fields;
		_params.username = self.session.user.username;
		var status = 201;
		var result = {};
		var appModel = this.model('rule_trick');
		yield function(callback) {
			appModel.findOneAndUpdateRow({
				_id: this.params.id
			}, _params, function(err, row) {
				if (!err && row) {
					result = {
						work: row
					};
					status = 201;
				} else {
					result = "修改失败!";
					status = 400;
				}
				callback();
			});
		};

		this.status = status;
		this.body = result;
	});

	// 删除话术管理
	$.delete("/rules/tricks/:id", function *(next) {
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}
		yield function(callback) {
			var appModel = this.model('rule_trick');
			appModel.deleteRow({
				_id: id
			}, function(err, row) {
				if (!err && row) {
					result = {
						app: row
					};
					status = 201;
				} else {
					result = "操作失败!";
					status = 400;
				}
				callback();
			});
			this.status = status;
			this.body = result;
		}
	})

	/**
	*@desc 验证话术名称是否存在
	*@param name 话术名称
	*@author fanxd
	*/
	$.get("/rules/tricks/validate/:name", function *(next) {
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}
		var result = {};
		var status = 200;
		var params = {};
		var name = this.params.name;
		if (name != '') {
			params.name = name;
		}
		var ruleTrickModel = this.model("rule_trick");
		yield function(callback) {
			ruleTrickModel.getRowsCount(params,function(err,count){
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
	})


}
