module.exports = function($) {

  //上传参数列表
  $.get("/import/create", function*(next) {
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

    var uploadParameterModel = this.model("import_parameter");
    yield function(callback) {
      uploadParameterModel.getPagedRows(params, offset, limit, {
        created: -1
      }, function(err, rows) {
        if (err) {
          status = 400;
        } else {
          console.log(rows)
          result = {
            rows: rows,
            offset: offset,
            limit: limit
          };
          callback();
        }
      });
    }

    //总页数
    yield function(callback) {
      uploadParameterModel.getRowsCount(params, function(err, count) {
        if (err) {
          status = 400;
        } else {
          var totalPage = Math.ceil(count / limit);
          result.totalPage = totalPage;
          callback()
        }
      })
    }

    result.title = '上传参数配置累表';
    var common = self.library("common");
    result.common = common;
    //yield self.render('', result);
  });

  //结果详情
  $.get("/import/create/:_id", function* (next) {
    var self = this;

    //将session放入ejs渲染数据中
    self.state.session = self.session;

    //admin 或 manager 角色才可访问
    if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
      self.redirect('/login');
      return;
    }

    var _id = this.params._id;

    var status = 200;
    var result = {};
    var uploadParameterModel = this.model("import_parameter");
    yield function (callback) {
      uploadParameterModel.getRow({ _id: _id }, function (err, row) {
        console.log(row)
        if (!err && row) {
          status = 200;
          result = row;
        } else {
          status = 404;
        }
        callback();
      });
    }
    this.status = status;
    this.body = result;
  });



  // 增加
  $.get("/import/add",function*(next){
    var self = this;
    //将session放入ejs渲染数据中
    self.state.session = self.session;
    //admin 或 manager 角色才可访问
    if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
      self.redirect('/login');
      return;
    }

    var params = {};
    var result = {};
    var status = 201;
    var _params = this.request.query;

  //  request_name : { type : String, default : '' }, 		// 用户实际参数
  //  system_name  : { type : String, default : '' },
    params= {
      radio_path  :  _params.radio_path,
      ticket_path : _params.ticket_path,
      upload_type : _params.upload_type,
      file_type   : _params.file_type
    }
    params['item'] = {
      "item_seq"   			     : _params.item_seq,
      "item_sit_number"      : _params.item_sit_number,
      "item_mobile"          : _params.item_mobile,
      "item_call_time"       : _params.item_call_time,
      "item_system"          : _params.item_system,
      "item_customer_name"   : _params.item_customer_name,
      "item_end_comment"     : _params.item_end_comment,
      "item_satisfy_comment" : _params.item_satisfy_comment,
      "item_call_duration"   : _params.item_call_duration,
      "item_mute_ratio"      : _params.item_mute_ratio,
      "item_customer_speed"  : _params.item_customer_speed,
      "item_agent_speed"     : _params.item_agent_speed,
      "item_mute_duration"   : _params.item_mute_duration
    }

    var uploadParameterModel = this.model("import_parameter");
    yield function(callback){
      uploadParameterModel.createRow(params,function(err,row){
        if(!err && row){
          status =200;
          result={
            app:row
          }
        }else{
          status=400;
          result="添加上传参数基本信息失败";
        }
        callback();
      })
    }
    this.status=status;
    this.body=result;
  })


  // 编辑
	$.put("/import/:id",function*(next){
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}

		var _params = this.request.fields;

		var params ={
			_id : this.params.id
		}
		var result={};
		var status = 201;
	  var uploadParameterModel = this.model("import_parameter");
		yield function(callback){
			uploadParameterModel.findOneAndUpdateRow(params,_params,function(err,row){
				if(!err && row){
					stauts = 200;
					result={
						app:row
					}
				}else{
					status =400;
					result="修改失败";
				}
				callback();
			})
		}
		this.status=status;
		this.body=result;
	})


	/**
	*@desc 删除
	*@param id 规则id
	*@author bcl
	*/
	$.delete("/import/:id",function*(next){
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
		var uploadParameterModel = this.model("import_parameter");

		var status =201;
		var rules = {};
		yield function(callback){
			uploadParameterModel.getRow(params,function(err,row){
				if(!err && row){
					uploadParameterModel.deleteRow(params,function(err,row){
						if(!err && row){
							status=200;
						}else{
							status=400;
							result="删除失败";
						}
						callback();
					})
				}else{
					status=400;
					result="查询失败";
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
  * @author bcl
  */
  $.get("/import/create/:name", function*(next){
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
      params.system_name = name;
    }
    var uploadParameterModel = this.model("import_parameter");
    yield function(callback){
      uploadParameterModel.getRowsCount(params,function(err,count){
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



}
