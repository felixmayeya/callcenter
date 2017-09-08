/**
* @desc 规则增删改查维护
* @author fanxd
*/
module.exports = function($) {

	/**
	* @desc 查询规则列表
	* @param offset 当前页数
	* @param limit 每页记录条数
	* @param name 规则名称，支持模糊查询
	* @param rule_group 规则集名称，支持模糊查询
	* @author fanxd
	*/
	$.get("/rules", function*(next){
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}
		var result = {};
		var status = 201;

		var _params = this.request.query;
		var offset = _params.offset ? _params.offset : 0;
		var limit = _params.limit ? _params.limit : config.get("limit");
		var params = {};

		var  name = _params["name"]?_params["name"]:"";
		if(name!=''){
			params.name = new RegExp(name, 'i');
		}
		var rule_group = _params["rule_group"] && _params["rule_group"] !== "all"?_params["rule_group"]:"";
		if(rule_group!=''){
			params.rule_group = new RegExp(rule_group, 'i');
		}

		var ruleGroupModel = this.model("rule_group");
		var ruleGroups = {};
		yield function(callback){
			ruleGroupModel.getColumnRows({},{"name":1},function(err, rows) {
				if (!err && rows) {
					status = 200;
					ruleGroups = rows;
				} else {
					status = 400;
					result="获取规则集列表失败";
				}
				callback();
			});
		}
		var totalPage = {};
		var ruleModel = this.model("rule");
		yield function(callback){
			ruleModel.getRowsCount(params,function(err,count){
				if(!err){
					totalPage = Math.ceil(count / limit);
				}else{
					status = 400;
					result="查询记录条数失败";
				}
				callback();
			});
		}
		yield function(callback){
			ruleModel.getPagedRows(params,offset,limit,{create:-1},function(err,rows){
				if(!err && rows){
					status =200;
					result={
						conts:rows,
						rule_group,rule_group,
						name,name,
						offset:offset,
						limit:limit,
						totalPage:totalPage,
						ruleGroups:ruleGroups
					}
				}else{
					status =400;
					result="查询记录失败";
				}
				callback();
			});
		}
		result.title =  '质检规则';

		var common = self.library("common");
		result.common = common;
		yield self.render('rules/rules', result);
	})


	/**
	* @desc 渲染创建规则页面
	* @author fanxd
	*/
	$.get("/rules/create", function*(next){
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}
		var result = {};
		var status = 201;

		var params = {};

		var ruleGroupModel = this.model("rule_group");
		var ruleGroups = {};
		yield function(callback){
			ruleGroupModel.getColumnRows({},{"name":1},function(err, rows) {
				if (!err && rows) {
					status = 200;
					result = {
						conts:rows
					}
				} else {
					status = 400;
					result="获取规则集列表失败";
				}
				callback();
			});
		}

		result.title =  '创建规则';

		var common = self.library("common");
		result.common = common;
		yield self.render('rules/new_rules', result);
	})


	/**
	* @desc 渲染编辑规则页面
	* @author fanxd
	*/
	$.get("/rules/edit/:ruleId", function*(next){
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}
		var result = {};
		var status = 201;

		var params = {};
		var rules = {};
		yield function(callback){
			var ruleModel = this.model("rule");
			ruleModel.getRow({_id: this.params.ruleId},function(err,rows){
				if(!err && rows){
					rules = rows;
				}else{
					status = 400;
					reuslt = "获取规则失败";
				}
				callback();
			})
		}
		var ruleGroupModel = this.model("rule_group");
		var ruleGroups = {};
		yield function(callback){
			ruleGroupModel.getColumnRows({},{"name":1},function(err, rows) {
				if (!err && rows) {
					status = 200;
					result = {
						ruleGroups:rows,
						rules : rules
					}
				} else {
					status = 400;
					result="获取规则集列表失败";
				}
				callback();
			});
		}


		result.title =  '创建规则';

		var common = self.library("common");
		result.common = common;
		yield self.render('rules/edit_rules', result);
	})

	// 增加规则
	$.post("/rules",function*(next){
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}

		var params = this.request.fields;
		var result = {};
		var status = 201;

		if(params.content){
			var Parser = self.library("logic_parser").Parser;
			var parser = new Parser(params.content);
			exp = parser.parse();
			params.parser_content =  JSON.stringify(exp);
		}

		var appModel = this.model("rule");
		yield function(callback){
			appModel.createRow(params,function(err,row){
				if(!err && row){
					status =200;
					result={
						app:row
					}
				}else{
					status=400;
					result="添加规则基本信息失败";
				}
				callback();
			})
		}
		this.status=status;
		this.body=result;
	})

	// 编辑规则
	$.put("/rules/:id",function*(next){
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}

		var _params = this.request.fields;

		if(_params.content){
			var Parser = self.library("logic_parser").Parser;
			var parser = new Parser(_params.content);
			exp = parser.parse();
			_params.parser_content =  JSON.stringify(exp);
		}

		var params ={
			_id : this.params.id
		}
		var result={};
		var status = 201;
		var appModel = this.model("rule");
		yield function(callback){
			appModel.findOneAndUpdateRow(params,_params,function(err,row){
				if(!err && row){
					stauts = 200;
					result={
						app:row
					}
				}else{
					status =400;
					result="修改关键词失败";
				}
				callback();
			})
		}
		this.status=status;
		this.body=result;
	})


	/**
	*@desc 删除规则,以及规则下的所有词组
	*@param id 规则id
	*@author fanxd
	*/
	$.delete("/rules/:id",function*(next){
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}

		var result={};
		var params = {
			_id:this.params.id
		}
		var _params = {
			rule:this.params.id
		}
		var appModel = this.model("rule");
		var rulePhraseModel = this.model("rule_phrase");
		var status =201;
		var rules = {};
		yield function(callback){
			appModel.getRow(params,function(err,row){
				if(!err && row){
					appModel.deleteRow(params,function(err,row){
						if(!err && row){
							status=200;
						}else{
							status=400;
							result="删除规则失败";
						}
						callback();
					})

					rulePhraseModel.deleteRow(_params,function(err,rows){
						if(!err && rows){
							status =200;
						}else{
							status = 400;
							result="删除规则词组失败";
						}
						callback();
					})
				}else{
					status=400;
					result="查询规则词组失败";
				}
			})
		}
		this.status = status;
		this.body=result;
	})

	/**
	* @desc 验证规则名称是否存在
	* @param type 验证类型 create 新建规则验证 edit 编辑规则验证
	* @param name 规则名称（精确查询）
	* @author fanxd
	*/
	$.get("/rules/validate/:name", function*(next){
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
		if(name!=''){
			params.name = name;
		}

		var ruleModel = this.model("rule");
		yield function(callback){
			ruleModel.getRowsCount(params,function(err,count){
				if(err){
					status = 400;
					result="验证规则名称失败";
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

	/**
	*@desc 变更规则的启动禁用状态
	*@param status 1启动，0禁用
	*@author fanxd
	*/
	$.put("/rules/change/status/:id",function*(next){
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}
		var status = this.request.fields.status;
 		var result={};
		var status = 200;
		var appModel = this.model("rule");
		yield function(callback){
			appModel.findOneAndUpdateRow({ _id : this.params.id },{status : status},function(err,row){
				if(!err && row){
 					result={
						status:20000
					}
				}else{
					status =400;
					result="变更规则状态失败";
				}
				callback();
			})
		}
		this.status=status;
		this.body=result;
	})

}
