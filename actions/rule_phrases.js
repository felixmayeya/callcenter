/**
* @Desc规则增删改查维护
* @author wst
*/
module.exports = function($) {

	/**
	* @desc 查询词组列表
	* @param offset 当前页数
	* @param limit 每页记录条数
	* @param name 词组名称，支持模糊查询
	* @author fanxd
	*/
	$.get("/rules/phrases", function *(next) {
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
		params.rule = "all";
		var appModel = this.model("rule_phrase");
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

		var common = self.library("common");
		result.common = common;
		result.title = '规则词组';
		
		yield self.render('rules/phrases', result);

	});


	//添加词组
	$.post("/rules/phrases", function *(next) {
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
		var status = 201;
		var appModel = this.model("rule_phrase");
		yield function(callback) {
			appModel.createRow(params, function(err, row) {
				if (!err && row) {
					result = {
						app: row
					};
					status = 200;
				} else {
					result = "添加词组失败!";
					status = 400;
				}
				callback();
			});
		};
		this.status = status;
	});


	//修改编辑词组
	$.put("/rules/phrases/:id", function *(next) {
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
		var status = 201;
		var _params = this.request.fields;
		_params.username=self.session.user.username;
		var appModel = this.model('rule_phrase');
		yield function(callback) {
			appModel.findOneAndUpdateRow(params, _params, function(err, row) {
				if (!err && row) {
					result = {
						work: row
					};
					status = 200;
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


	//删除词组
	$.delete("/rules/phrases/:id", function *(next) {
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
		var status = 201;
		var appModel = this.model('rule_phrase');
		yield function (callback) {
			appModel.deleteRow(params, function(err, row) {
				if (!err && row) {
					result = {
						app: row
					};
					status = 200;
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
	* @desc 查询指定规则下的词组以及所有通用词组
	* @param type 查询类型  all 所有通用词组以及指定规则下的词组， rule 指定规则下的词组
	* @param ruleId 指定的规则id
	* @author fanxd
	*/
	$.get("/rules/phrases/category/:type/:ruleId", function *(next) {
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}
		var params = {};
		var type = this.params.type;
		if(type==="all"){
			params ={
				"$or":[{rule:"all"},{rule:this.params.ruleId}]
			}
		}else if(type==="rule"){
			params = {
				rule : this.params.ruleId
			}
		}

		var status = 201;

		var appModel = this.model("rule_phrase");
		yield function(callback) {
			appModel.getRows(params, function(err, rows) {
				if (!err && rows) {
					result = {
						conts: rows
					};
					status = 200;
				} else {
					result = "查询指定规则下的词组失败!";
					status = 400;
				}
				callback();
			});
		};
		this.status = status;
		this.body = result;
	});


	/**
	* @desc 验证词组是否存在
	* @param name 词组名称（精确查询）
	* @author wts
	*/
	$.get("/rules/phrases/validate/:name", function *(next) {
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

		var rulePhraseModel = this.model("rule_phrase");
		yield function(callback) {
			rulePhraseModel.getRowsCount(params,function(err,count){
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


}
