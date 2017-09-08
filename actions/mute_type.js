/**
* @desc 静音分类增删改查维护操作
* @author fanxd
*/
module.exports = function($) {

 	/**
	*@desc 静音类型列表
	*@param 静音内容
	*@author fanxd
	*/
	$.get("/mute/types", function*(next){
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}
		var status = 200;

		var _param = this.request.query;
		var offset = _param.offset?_param.offset:0;
		var limit = _param.limit? _param.limit :config.get("limit");
		var name = _param["name"] ? _param["name"] : "";
		var params = {};
		if(name !=''){
			params.name = new RegExp(name, 'i');
		}

		var totalPage = {};
		var result = {};
		yield function(callback) {
			var muteModel = this.model('mute_type');
			muteModel.getRowsCount(params,function(err,count){
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
			var muteModel = this.model('mute_type');
			muteModel.getPagedRows(params,offset,limit,{create:-1}, function(err, rows) {
				if (err) {
					status = 400;
				} else {
 					result= {
						conts:rows,
						name: name,
						offset: offset,
						limit: limit,
						totalPage: totalPage
					}
				}
				callback();
			});
		}

		result.title =  '静音类型';

		var common = self.library("common");
		result.common = common;
		yield self.render('/rules/mutes', result);
	})

	/**
	*@desc 添加静音分类
	*@param 静音内容
	*@author fanxd
	*/
	$.post("/mute/types",function*(next){
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
		var status = 200;
		var result = {};

		yield function(callback){
			var muteModel = this.model('mute_type');
			muteModel.createRow(_params,function(err,row){
				if(!err && row){
 					result = {
						app:row
					}
				}else{
					result = "添加静音类型失败!";
					status = 400;
				}
				callback();
			});
		};
		this.status = status;
		this.body = result;
	});

 	/**
	*@desc 编辑静音分类
	*@param 静音分类id
	*@param 静音修改内容
	*@author fanxd
	*/
	$.put("/mute/types/:id",function*(next){
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
		var status = 200;
		var result = [];
		var muteModel = this.model('mute_type');
		yield function(callback){
			muteModel.findOneAndUpdateRow(params,_params,function(err,row){
				if(!err && row){
 					result={
						app:row
					}
				}else{
					status =400;
					result="修改静音类型失败";
				}
				callback();
			});
		}
		this.status = status;
		this.body = result;
	});

	/**
	*@desc 删除静音分类
	*@param 静音分类id
	*@author fanxd
	*/
	$.delete("/mute/types/:id",function*(next){
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
		var muteModel = this.model('mute_type');
		var status = 201;
		var result=[];
		yield function(callback){
			muteModel.getRow(params,function(err,row){
				if(!err && row){
					muteModel.deleteRow(params,function(err,row){
						if(!err && row){
							stauts = 200;
							result = {
								app: row
							}
						}else{
							result = "删除静音类型操作失败!";
							status = 400;
						}
						callback();
					});
				}else{
					result = "查询静音类型操作失败!";
					status = 400;
					callback();
				}
			});
		}
		this.status = status;
		this.body = result;
	});


	/**
	*@desc 验证关键词静音类型是否存在
	*@param name 关键词
	*@author fanxd
	*/
	$.get("/mute/types/validate/:name", function*(next){
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
		var muteModel = this.model('mute_type');
		yield function(callback) {
			muteModel.getRowsCount(params,function(err,count){
				if(err){
					status = 400;
					result="验证静音类型类型失败";
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
