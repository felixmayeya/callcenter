/**
*@desc 规则集增删查维护操作
*@author fanxd
*/
module.exports = function($) {

	//获取规则集
	$.get("/rules/groups", function *(next){
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
		var _params = this.request.query;
		var offset = _params.offset ? _params.offset : 0;
		var limit = _params.limit ? _params.limit : config.get("limit");
		var params = {};
		var name = _params["name"] ? _params["name"] : "";
		if (name != '') {
			params.name = new RegExp(name, 'i');
		}
		var appModel = this.model("rule_group");
		var totalPage={};
		yield function(callback) {
			appModel.getRowsCount(params, function(err, count) {
				if(!err){
					totalPage = Math.ceil(count / limit);
				}
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

		result.title = '质检规则集';

		var common = self.library("common");
		result.common = common;
		yield self.render('/rules/groups', result);
	})


	//添加规则集
	$.post("/rules/groups", function *(next) {
		var self = this;

		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}
		var status =200;
		var _params = this.request.fields;
		_params.username= self.session.user.username;
		yield function(callback) {
			var appModel = this.model("rule_group");
			appModel.createRow(_params, function(err, row){
				if (!err && row) {
					result = {
						app: row
					};
				} else {
					result = "添加规则集失败!";
					status = 400;
				}
				callback();
			});
		};
		this.status = status;
		this.body = result;
	});


	//修改规则集
	$.put("/rules/groups/:id", function *(next) {
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
		var _params = this.request.fields;
		_params.username= self.session.user.username;
		var status = 200;
		var result = {};
		var appModel = this.model("rule_group");
		yield function(callback) {
			appModel.findOneAndUpdateRow(params,_params, function(err, row) {
				if (!err && row) {
					result = {
						work: row
					};
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



	/**
	*@desc 删除规则集，同时删除规则集下的所有规则，以及规则下的所有词组
	*@param id 规则集id  _id
	*@author fanxd
	*/
	$.delete("/rules/groups/:id", function *(next) {
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}
		var id = this.params.id;
		var status =200;
		var result = {};
		var ruleGroupModel = this.model("rule_group");
		var ruleModel = this.model("rule");
		var rulePhraseModel = this.model("rule_phrase");

		yield function(callback) {
			ruleGroupModel.deleteRow({ _id : id }, function(err, row) {
				if (err) {
					result = "操作失败!";
					status = 400;
				}
				callback();
			});
		}

		yield function(callback) {
			ruleModel.getRows({rule_group:id},function(err,rows){
				if(!err && rows){
					for(var i in rows){
						rulePhraseModel.deleteRow({ rule : rows[i]._id },function(err,row){
							if(!err && row){
								status =200;
							}else{
								status = 400;
								result="删除规则词组失败";
							}
							callback();
						});
					}
				} else {
					status=400;
					result="查询规则失败";
				}
			});
		}

		yield function(callback){
			ruleModel.deleteRow({ rule_group : id },function(err,row){
				if(err) {
					status=400;
					result="删除规则失败";
				}
				callback();
			})
		}

		this.status = status;
		this.body = result;

	});


	/**
	*@desc 验证规则集是否存在
	*@param name 规则集名称
	*@author fanxd
	*/
	$.get("/rules/groups/validate/:name", function*(next){
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}
		var status = 200;

		var params = {};
		var name = this.params.name;
		if(name !=''){
			params.name = name;
		}

		var result = {};
		var ruleGroupModel = this.model('rule_group');
		yield function(callback) {
			ruleGroupModel.getRowsCount(params,function(err,count){
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
	*@desc  变更规则集状态
	*@param status  1 启用  0 禁用
	*@author fanxd
	*/
	$.put("/rules/groups/change/status/:id", function *(next) {
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
		var result = {};
		var ruleGroupModel = this.model("rule_group");
		yield function(callback) {
			ruleGroupModel.findOneAndUpdateRow({ _id:this.params.id },{status : status}, function(err, row) {
				if (!err && row) {
					result = {
						status:20000
					};
				} else {
					result = "修改规则集失败!";
					status = 400;
				}
				callback();
			});
		};

		var ruleModel = this.model("rule");
		yield function(callback) {
			ruleModel.updateRow({ rule_group : this.params.id },{status : status}, function(err, rows) {
				if (!err && rows) {
					result = {
						status:20000
					};
				} else {
					result = "修改规则集所属规则失败!";
					status = 400;
				}
				callback();
			});
		};
		this.status = status;
		this.body = result;
	});



}
