module.exports = function ($) {

  //系统列表
  $.get("/systems", function* (next) {
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

    var name = _params["name"] ? _params["name"] : "";
    if (name != '') {
      params.name = new RegExp(name, 'i');
    }

    var result = {};
    var status = 200;

    var systemModel = this.model("system");
    yield function (callback) {
      systemModel.getRowsCount(params, function (err, count) {
        totalPage = Math.ceil(count / limit);
        systemModel.getPagedRows(params, offset, limit, {
          created: -1
        }, function (err, rows) {
          if (err) {
            status = 400;
          } else {
            result = {
              rows: rows,
              name: name,
              offset: offset,
              limit: limit,
              totalPage: totalPage
            };
          }
          callback();
        });
      });
    }

    result.title = '语音系统';
    
    result.common = self.library("common");

    yield self.render('systems/systems', result);
  });

  //创建系统
  $.post("/systems", function* (next) {
    var self = this;

    //将session放入ejs渲染数据中
    self.state.session = self.session;

    //admin 或 manager 角色才可访问
    if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
      self.redirect('/login');
      return;
    }

    var _params = this.request.fields;

    var status = 201;
    var result = {};

    //创建
    yield function (callback) {
      var systemModel = this.model("system");
      systemModel.createRow(_params, function (err, row) {
        if (!err && row) {
          status = 201;
          callback();
        } else {
          result = "更新失败!";
          status = 400;
          callback();
        }
      });
    };

    this.status = status;
    this.body = result;
  });

  //编辑系统
  $.put("/systems/:_id", function* (next) {
    var self = this;

    //将session放入ejs渲染数据中
    self.state.session = self.session;

    //admin 或 manager 角色才可访问
    if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
      self.redirect('/login');
      return;
    }

    var _id = this.params._id;
    var _params = this.request.fields;

    var status = 201;
    var result = {};

    var systemModel = this.model('system');
    yield function (callback) {
      systemModel.findOneAndUpdateRow({
        _id: _id
      }, _params, function (err, row) {
        if (!err && row) {
          result = {
            work: row
          };
          status = 201;
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

  //系统详情
  $.get("/systems/:_id", function* (next) {
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
    var systemModel = this.model("system");
    yield function (callback) {
      systemModel.getRow({ _id: _id }, function (err, row) {
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

  //删除系统
  $.delete("/systems/:_id", function* (next) {
    var self = this;

    //将session放入ejs渲染数据中
    self.state.session = self.session;

    //admin 或 manager 角色才可访问
    if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
      self.redirect('/login');
      return;
    }

    var _id = this.params._id;

    var result = {};

    var systemModel = this.model('system');
    yield function (callback) {

      systemModel.deleteRow({
        _id: _id
      }, function (err, row) {
        if (!err && row) {
          result = {
            system: row
          };
          status = 201;
        } else {
          result = "操作失败!";
          status = 400;
        }
        callback();
      });

    };

    this.status = status;
    this.body = result;
  });
  /**
	* @desc 验证系统名称是否存在
	* @param name 系统名称（精确查询）
	* @author wts
	*/
	$.get("/systems/validate/:name", function *(next) {
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}
    var systemsname = this.params.name;
    var params={};
    var result = {};
    var status = 200;
    if(systemsname !=''){
      params.name = systemsname;
    }


		var systemModel = this.model("system");
		yield function(callback) {
			systemModel.getRowsCount(params,function(err,count){
				if(err){
					status = 400;
					result="系统名称失败";
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

  //录音质检
  $.get("/audios/inspection", function* (next) {
    var self = this;

    //将session放入ejs渲染数据中
    self.state.session = self.session;

    //admin 或 manager 角色才可访问
      if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
      self.redirect('/login');
      return;
    }

    var result = {};
    result.title = '语音系统';
    

    yield self.render('audio_inspection', result);
  })
};
