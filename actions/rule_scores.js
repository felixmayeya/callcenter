/**
* @desc 自动质检规则评分
* @author fanxd
*/
module.exports = function($) {
	//查询评分规则列表
	$.get("/rules/scores", function*(next){
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}
		var status=201;
		var params = {};
		var _params = this.request.query;
		var offset = _params.offset ? _params.offset : 0;
		var limit = _params.limit ? _params.limit : config.get("limit");
		var system = _params["system"] && _params["system"]!== "all" ? _params["system"] : "";
		var rule_base = _params["rule_base"]&& _params["rule_base"]!== "all" ? _params["rule_base"] : "";
		if(system !=''){
			params.system = system;
		}
		if(rule_base !=''){
			params.rule_base = rule_base;
		}

		var systems = {};
		yield function(callback){
			var systemModel = this.model("system");
			systemModel.getColumnRows({},{"name":1},function(err,rows){
				if(!err && rows){
					systems = rows;
				}
				callback();
			});
		}
		var rules = [];
		yield function(callback){
			var ruleModel = this.model("rule");
			ruleModel.getColumnRows({},{"name":1},function(err,rows){
				if(!err && rows){
					rows.forEach(function(row){
						var rule ={};
						rule._id = row._id;
						rule.name = row.name;
						rule.rule_type= "rule";
						rules.push(rule);
					});
				}
				callback();
			});
		}

		var thresholdModel = this.model('rule_threshold');
		yield function (callback) {
			thresholdModel.getRows({}, function (err, rows) {
				if (!err && rows) {
					rows.forEach(function(row){
						var rule = {};
						rule._id=row._id;
						rule.name=row.name;
						rule.rule_type=row.code;
						rules.push(rule);
					});
					status = 200;
				} else {
					status = 404;
				}
				callback();
			});
		}

		yield function(callback){
			var ruleManualTypeModel = this.model("rule_manual_type");
			ruleManualTypeModel.getColumnRows({},{"name":1},function(err,rows){
				if(!err && rows){
					rows.forEach(function(row){
						var rule ={};
						rule._id = row._id;
						rule.name = row.name;
						rule.rule_type= "rule_manual_type";
						rules.push(rule);
					});
				}
				callback();
			});
		}

		var result = {};
		var totalPage = {};
		yield function(callback){
			var ruleScoreModel = this.model("rule_score");
			ruleScoreModel.getRowsCount(params,function(err,count){
				if(!err){
					totalPage = Math.ceil(count / limit);
				}else{
					stauts=400;
					result="查询评分规则总记录数失败";
				}
				callback();
			})
		}

		yield function(callback){
			var ruleScoreModel = this.model("rule_score");
			ruleScoreModel.getPagedRows(params,offset,limit ,{create:-1}, function(err,rows){
				if(!err && rows){
					status=200;
					result={
						conts:rows,
						rule_base:rule_base,
						system:system,
						offset:offset,
						limit:limit,
						totalPage,totalPage,
						systems:systems,
						rules:rules
					}
				}else{
					stauts=400;
					result="查询评分规则列表失败";
				}
				callback();
			})
		}


		result.title =  '评分规则';

		var common = self.library("common");
		result.common = common;
		yield self.render('rules/scores', result);
	})

	//添加评分规则
	$.post("/rules/scores",function*(next){
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}

		var params = this.request.fields;

		if(params.rule_base === 'manual'){
			params.rule_base = "人工质检评分规则库";
		}else{
			params.rule_base = "智能质检评分规则库";
		}
		var status=201;
		var result={};
		yield function(callback){
			var appModel = this.model("rule_score");
			appModel.createRow(params,function(err,row){
				if(!err && row){
					status=200;
					result={
						app:row
					}
				}else{
					status=400;
					result="创建评分规则失败";
				}
				callback();
			})
		}
		this.status=status;
		this.body=result;
	})
	//编辑评分规则
	$.put("/rules/scores/:id",function*(next){
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}

		var _params = this.request.fields;
		var params={
			_id:this.params.id
		}
		if(_params.rule_base === 'manual'){
			_params.rule_base = "人工质检评分规则库";
		}else{
			_params.rule_base = "智能质检评分规则库";
		}
		var status =201;
		var result = {};
		yield function(callback){
			var appModel = this.model("rule_score");
			appModel.findOneAndUpdateRow(params,_params,function(err,row){
				if(!err && row){
					result={
						app:row
					}
					status=200;
				}else{
					status=400;
					result="编辑评分规则失败";
				}
				callback();
			})
		}
		this.status=status;
		this.body=result;
	})
	//删除评分规则
	$.delete("/rules/scores/:id",function*(next){
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
		var status =201;
		var result={};

		var appModel = this.model("rule_score");
		yield function(callback){
			appModel.deleteRow(params,function(err,row){
				if(!err && row){
					status=200;
					result={
						app:row
					}
				}else{
					status=400;
					result="删除评分规则失败";
				}
				callback();
			});
		}

		this.status=status;
		this.body=result;
	});


	/**
	*@desc 获取可选规则（包含自定义规则和阈值）
	*@param systemid 系统id
	*@author wts
	*/
	$.get("/rules/scores/rules/:type/:system", function*(next){
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}
		var status = 200;
		var type = this.params.type;
		var params = {};
		var _params = {};
		if(this.params.system !=''){
			params.system = this.params.system;
		}
		var result = {};
		var rules = [];
		if(type === "manual"){
			yield function(callback){
				var ruleManualTypeModel = this.model("rule_manual_type");
				ruleManualTypeModel.getColumnRows({},{"name":1},function(err,rows){
					if(!err && rows){
						rows.forEach(function(row){
							var rule ={};
							rule._id = row._id;
							rule.name = row.name;
							rule.rule_type= "rule_manual_type";
							rules.push(rule);
						});
					}
					callback();
				});
			}

			_params = {_id:0,artificial:1};
		}else{
			yield function(callback){
				var ruleModel = this.model("rule");
				ruleModel.getColumnRows({},{"name":1},function(err,rows){
					if(!err && rows){
						rows.forEach(function(row){
							var rule ={};
							rule._id = row._id;
							rule.name = row.name;
							rule.rule_type= "rule";
							rules.push(rule);
						});
					}
					callback();
				});
			}

			var thresholdModel = this.model('rule_threshold');
			yield function (callback) {
				thresholdModel.getRows(params, function (err, rows) {
					if (!err && rows) {
						rows.forEach(function(row){
							var rule = {};
							rule._id=row._id;
							rule.name=row.name;
							rule.rule_type=row.code;
							rules.push(rule);
						});
						status = 200;
					} else {
						status = 404;
					}
					callback();
				});
			}
			_params = {_id:0,intelligent:1};

		}
		result.rules = rules;

		//权重分值
		var ruleWeightModel = this.model("rule_weight");
		var weight =0;
		yield function(callback){
			ruleWeightModel.getColumnRow(params,_params,function(err,row){
				if(!err && row){
					if(type==="manual"){
						weight = row.artificial;
					}else{
						weight = row.intelligent;
					}
				}
				callback();
			});
		}
		//db.getCollection('rule_scores').aggregate([{ $match : { system : "59562e0b3081e182a8097f8f",rule_base : "智能质检评分规则库" } },{$group : { _id : "$system", sum : {$sum : "$score"}}}])
		//var match = { system : "59562e0b3081e182a8097f8f",rule_base : "智能质检评分规则库" } ;
		//var group = {$group : { _id : "$system", sum : {$sum : "$score"}}};
		if(type==="manual"){
			params.rule_base = "人工质检评分规则库";
		}else{
			params.rule_base = "智能质检评分规则库";
		}

		var condition =[{$match : params },{$group : { _id : "$system", "sum" : {$sum : "$score"}}}];
		//查询已设置的评分
		var ruleScoreModel = this.model("rule_score");
		var used = 0;
		yield function(callback){

			ruleScoreModel.aggregateRow(condition,function(err,row){
				if(!err && JSON.stringify(row)!="[]"){
					used = row[0].sum;
				}
				callback();
			});
		}

		result.weight = weight;
		result.use = weight-used;
		this.status = status;
		this.body = result;
	})

}
