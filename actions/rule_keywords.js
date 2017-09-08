/**
* @desc 关键词增删改查维护操作
* @author fanxd
*/
module.exports = function($) {

	//关键词列表
	$.get("/rules/keywords", function*(next){
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}
		var status = 200;

		var _params = this.request.query;
		var offset = _params.offset?_params.offset:0;
		var limit = _params.limit? _params.limit :config.get("limit");
		var params = {};
		var content = _params["content"] ? _params["content"] : "";
		if(content !=''){
			params.content = new RegExp(content, 'i');
		}
		var type = _params["type"] && _params["type"] !== "all"?_params["type"]:"";
		if(type !=''){
			params.type = new RegExp(type, 'i');
		}

		var keyword_types = {};
		yield function(callback){
			var ruleKeyWordTypeModel = this.model('rule_keyword_type');
			ruleKeyWordTypeModel.getColumnRows({status:1},{content:1},function(err,rows){
				if(!err && rows){
					keyword_types = rows;
				}
				callback();
			});
		}

		var totalPage = {};
		var result = {};
		yield function(callback) {
			var ruleKeyWordModel = this.model('rule_keyword');
			ruleKeyWordModel.getRowsCount(params,function(err,count){
				if(!err){
					totalPage = Math.ceil(count / limit);
				}else{
					status = 400;
					result = "查询记录条数失败";
				}
				callback();
			});
		}

		yield function(callback) {
			var ruleKeyWordModel = this.model('rule_keyword');
			ruleKeyWordModel.getPagedRows(params,offset,limit,{create:-1}, function(err, rows) {
				if (err) {
					status = 400;
				} else {
					status = 200;
					result= {
						conts:rows,
						content: content,
						offset: offset,
						limit: limit,
						totalPage: totalPage,
						keyword_types : keyword_types,
						type :type
					}
				}
				callback();
			});
		}

		result.title =  '关键词';

		var common = self.library("common");
		result.common = common;
		yield self.render('/rules/keywords', result);
	})

	// 添加关键词
	$.post("/rules/keywords",function*(next){
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

		yield function(callback){
			var ruleKeyWordModel = this.model('rule_keyword');
			ruleKeyWordModel.createRow(_params,function(err,row){
				if(!err && row){
					status =200;
					result = {
						app:row
					}
				}else{
					result = "添加关键词失败!";
					status = 400;
				}
				callback();
			});
		};
		this.status = status;
		this.body = result;
	});

	// 编辑关键词
	$.put("/rules/keywords/:id",function*(next){
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}

		var params = {
			_id : this.params.id
		}
		var _params = this.request.fields;
		_params.username = self.session.user.username;
		var status = 201;
		var result = [];
		var ruleKeyWordModel = this.model('rule_keyword');
		yield function(callback){
			ruleKeyWordModel.findOneAndUpdateRow(params,_params,function(err,row){
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
			});
		}
		this.status = status;
		this.body = result;
	});

	//删除关键词
	$.delete("/rules/keywords/:id",function*(next){
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}

		var params ={
			_id : this.params.id
		}
		var ruleKeyWordModel = this.model('rule_keyword');
		var status = 201;
		var result=[];
		yield function(callback){
			ruleKeyWordModel.getRow(params,function(err,row){
				if(!err && row){
					ruleKeyWordModel.deleteRow(params,function(err,row){
						if(!err && row){
							stauts = 200;
							result = {
								app: row
							}
						}else{
							result = "删除关键词操作失败!";
							status = 400;
						}
						callback();
					});
				}else{
					result = "查询关键词操作失败!";
					status = 400;
					callback();
				}
			});
		}
		this.status = status;
		this.body = result;
	});


	/**
	*@desc 验证关键词是否存在
	*@param content 关键词
	*@author fanxd
	*/
	$.get("/rules/keywords/validate/:content", function*(next){
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
		var content = this.params.content;
		if(content !=''){
			params.content = content;
		}

		var result = {};
		var ruleKeyWordModel = this.model('rule_keyword');
		yield function(callback) {
			ruleKeyWordModel.getRowsCount(params,function(err,count){
				if(err){
					status = 400;
					result="验证关键词失败";
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
	*@desc 关键词状态变更()
	*@param status  状态 1 启用 0 禁用
	*@author fanxd
	*/
	$.put("/rules/keywords/change/status/:id",function*(next){
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

		var ruleKeyWordModel = this.model('rule_keyword');
		yield function(callback){
			ruleKeyWordModel.findOneAndUpdateRow({ type : this.params.id },{status:status},function(err,row){
				if(!err && row){
					stauts = 200;
					result={
						stauts:20000
					}
				}else{
					status =400;
					result="修改关键词状态失败";
				}
				callback();
			});
		}

		this.status = status;
		this.body = result;
	});

}
