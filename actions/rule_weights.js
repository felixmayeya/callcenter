/**
* @desc 权重增删改查维护
* @author fanxd
*/
module.exports = function($) {

	//查询权重列表
	$.get("/rules/weights", function*(next){
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}

		var params = {};

		var _params = this.request.query;
		var offset = _params.offset ? _params.offset : 0;
		var limit = _params.limit ? _params.limit : config.get("limit");
		var system = _params['system']  && _params["system"]!== "all"?_params['system']:"";
		if(system!=''){
			params.system = system;
		}

		var sysstems = {};
		yield function(callback){
			var systemModel = this.model("system");
			systemModel.getColumnRows({},{"name":1},function(err,rows){
				if(!err && rows){
					systems = rows;
				}
				callback();
			})
		}

		var totalPage = {};
		yield function(callback){
			var ruleWeightModel = this.model("rule_weight");
			ruleWeightModel.getRowsCount(params,function(err,count){
				if(!err){
					totalPage = Math.ceil(count / limit);
				}else{
					status = 400;
					result="查询权重记录条数失败";
				}
				callback();
			})
		}

		var result = {};
		yield function(callback){
			var ruleWeightModel = this.model("rule_weight");
			ruleWeightModel.getPagedRows(params,offset,limit,{create:-1},function(err,rows){
				if(!err && rows){
					status=200;
					result={
						conts:rows,
						offset:offset,
						system:system,
						limit:limit,
						totalPage:totalPage,
						systems:systems
					}
				}else{
					status=400;
					result="查询权重列表失败";
				}
				callback();
			})
		}

		result.title =  '权重管理';

		var common = self.library("common");
		result.common = common;
		yield self.render('rules/weights', result);
	})


	//添加权重
	$.post("/rules/weights",function*(next){
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}

		var params = this.request.fields;
		var status=201;
		var result={};

		yield function(callback){
			var appModel = this.model("rule_weight");
			appModel.createRow(params,function(err,row){
				if(!err && row){
					status=200;
					result={
						app:row
					}
				}else{
					status=400;
					result="添加权重失败";
				}
				callback();
			})
		}
		this.status=status;
		this.body=result;
	})


	//编辑权重
	$.put("/rules/weights/:id",function*(next){
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}

		var params={
			_id:this.params.id
		}
		var _params = this.request.fields;
		var status =201;
		var result={};
		yield function(callback){
			var appModel = this.model("rule_weight");
			appModel.findOneAndUpdateRow(params,_params,function(err,row){
				if(!err && row){
					status=200;
					result={
						app:row
					}
				}else{
					status=400;
					result="修改权重失败";
				}
				callback();
			})
		}
		this.status=status;
		this.body=result;
	})


	//删除权重
	$.delete("/rules/weights/:id",function*(next){
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
		var status=201;
		var result={};

		yield function(callback){
			var appModel = this.model("rule_weight");
			appModel.getRow(params,function(err,row){
				if(!err){
					appModel.deleteRow(params,function(err,row){
						if(!err && row){
							status =200;
							result={
								app:row
							}
						}else{
							status=400;
							result="删除权重操作失败";
						}
						callback();
					})
				}else{
					status=400;
					result="查询删除的记录失败";
				}
			});
 		}

		this.status=status;
		this.body=result;
	});


	/**
	*@desc 权重验证（同一系统只能有一条记录）
	*@param system
	*@author fanxd
	*/
	$.get("/rules/weights/validate/:system",function*(next){
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}

		var params = {
			system:this.params.system
		}
		var status=201;
		var result={};

		yield function(callback){
			var ruleWeightModel = this.model("rule_weight");
			ruleWeightModel.getRowsCount(params,function(err,count){
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

		this.status=status;
		this.body=result;
	});

}
