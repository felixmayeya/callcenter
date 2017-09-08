module.exports = function($) {

  //用户列表
  $.get("/users", function*(next) {
    var self = this;

    //将session放入ejs渲染数据中
    self.state.session = self.session;

    //admin 或 manager 角色才可访问
    if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
      self.redirect('/login');
      return;
    }
    

    var _params = this.request.query;
    var offset = _params.offset ? _params.offset : 0;
    var limit = _params.limit ? _params.limit : config.get("limit");

    var result = {};
    var status = 200;

    var params = {};

    var  user_group =  _params["user_group"] && _params["user_group"] !== "all"?_params["user_group"]:"";
    if(user_group!=''){
      params.user_group = new RegExp(user_group, 'i');
    }
    var  role = _params["role"] && _params["role"] !== "all"?_params["role"]:"";
    if(role!=''){
      params.role = new RegExp(role, 'i');
    }

    var userModel = this.model("user");
    var userGroupModel = this.model("user_group");
    var roleModel = this.model("role");

    yield function(callback) {
      userModel.getRowsCount(params, function(err, count) {
        totalPage = Math.ceil(count / limit);
        userModel.getPagedRows(params, offset, limit, {
          created: -1
        }, function(err, rows) {
          if (err) {
            status = 400;
          } else {
            result = {
              rows: rows,
              user_group: user_group,
              role: role,
              offset: offset,
              limit: limit,
              totalPage: totalPage
            };
          }
          callback();
        });
      });
    }

    //获取业务组
    yield function(callback) {
      userGroupModel.getRows({}, function(err, rows) {
        if (err) {
          status = 400;
        } else {
          result.groups = rows;
        }
        callback();
      });
    }

    //获取角色
    yield function(callback) {
      roleModel.getRows({}, function(err, rows) {
        if (err) {
          status = 400;
        } else {
          result.roles = rows;
        }
        callback();
      });
    }

    //获取用户配置信息
    var userConfigModel = this.model("user_config");
    yield function(callback) {
      userConfigModel.getRow({}, function(err, row) {
        if (err) {
          status = 400;
        } else {
          result.userConfig = row;
        }
        callback();
      });
    }

    var common = self.library("common");
    result.common = common;
    result.title =  '用户';
    yield self.render('users/users', result);
  });

  //创建用户
  $.post("/users", function*(next) {
    var self = this;
    var _params = this.request.fields;

    var status = 201;
    var result = {};

    //创建
    yield function(callback) {
      var userModel = this.model("user");

      userModel.getRow({ username: _params.username }, function(err, row) {
        if (!err && row) {
          status = 400;
          result = "用户名已经存在！";
          callback();
        } else {
          userModel.createRow(_params, function(err, row) {
            if (!err && row) {
              status = 201;
            } else {
              result = "创建失败!";
              status = 400;
            }
            callback();
          });
        }
      });
    };

    this.status = status;
    this.body = result;
  });

  //编辑用户
  $.put("/users/:_id", function*(next) {
    var _id = this.params._id;
    var _params = this.request.fields;

    var status = 201;
    var result = {};

    var userModel = this.model("user");
    yield function(callback) {

      userModel.getRow({ username: _params.username, _id: { $ne: _id}}, function(err, row) {
        if (!err && row) {
          status = 400;
          result = "用户名已经存在！";
          callback();
        } else {
          userModel.findOneAndUpdateRow({
            _id: _id
          }, _params, function(err, row) {
            if (!err && row) {
              status = 201;
            } else {
              result = "更新失败!";
              status = 400;
            }
            callback();
          });
        }
      });
    };

    this.status = status;
    this.body = result;
  });

  //用户信息
  $.get("/users/:_id", function*(next) {
    var self = this;
    var _id = this.params._id;

    var status = 200;
    var result = {};
    var userModel = this.model("user");
    yield function(callback) {
      userModel.getRow({ _id: _id }, function(err, row) {
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

  //删除用户
  $.delete("/users/:_id", function*(next) {
    var self = this;
    var result = {};

    var _id = this.params._id;

    var userModel = this.model("user");
    yield function(callback) {
      userModel.deleteRow({
        _id: _id
      }, function(err, row) {
        if (!err && row) {
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
  * @desc 验证用户名是否存在
  * @param name 用户名名称（精确查询）
  * @author wts
  */
  $.get("/users/validate/:name", function *(next) {
    var self = this;
    //将session放入ejs渲染数据中
    self.state.session = self.session;
    //admin 或 manager 角色才可访问
    if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
      self.redirect('/login');
      return;
    }
    var username = this.params.name;
    var params={};
    var result = {};
    var status = 200;
    if(username !=''){
      params.username = username;
    }
    var userModel = this.model("user");
    yield function(callback) {
      userModel.getRowsCount(params,function(err,count){
        if(err){
          status = 400;
          result="用户名名称失败";
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
  * @desc 验证座席工号是否存在
  * @param sit_number 座席工号（精确查询）
  * @author fanxd
  */
  $.get("/users/validate/sitnumber/:sit_number", function *(next) {
    var self = this;
    //将session放入ejs渲染数据中
    self.state.session = self.session;
    //admin 或 manager 角色才可访问
    if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
      self.redirect('/login');
      return;
    }
    var params={};
    var result = {};
    var status = 200;
    var sit_number = this.params.sit_number;
    if(sit_number !=''){
      params.sit_number = sit_number;
    }
    var userModel = this.model("user");
    yield function(callback) {
      userModel.getRowsCount(params,function(err,count){
        if(err){
          status = 400;
          result="座席工号名称失败";
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
  *@desc 管理员初始化用户密码
  *@param 用户id
  *@author fanxd
  */
  $.put("/users/init/password/:id", function*(next) {
    var self = this;

    //将session放入ejs渲染数据中
    self.state.session = self.session;
    //admin 或 manager 角色才可访问
    if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
      self.redirect('/login');
      return;
    }

    var id = this.params.id;

    var status = 200;
    var result = {};
    var crypto = require('crypto');
    var md5 = crypto.createHash('md5');
    md5.update('666666', 'utf8');
    var password = md5.digest('hex');

    var userModel = this.model("user");
    yield function(callback) {
      userModel.findOneAndUpdateRow({ _id: id }, {"password":password}, function(err, row) {
        if (!err && row) {
          result= {
            "code" : "20000",
            "msg" : "密码初始化成功,默认密码666666，请尽快修改初始密码！"
          }
        } else {
          status = 400;
          result= {
            "code" : "20001",
            "msg" : "密码初始化失败"
          }
        }
        callback();
      });
    };

    this.status = status;
    this.body = result;
  });

  /**
  *@desc 用户修改用户密码
  *@param 用户id
  *@author fanxd
  */
  $.put("/users/change/password/:id", function*(next) {
    var self = this;

    //将session放入ejs渲染数据中
    self.state.session = self.session;
    //admin 或 manager 角色才可访问
    if (!self.session.user) {
      self.redirect('/login');
      return;
    }

    var id = this.params.id;
    var password = this.request.fields.password;
    var status = 200;
    var result = {};

    var userModel = this.model("user");
    yield function(callback) {
      userModel.findOneAndUpdateRow({ _id: id }, {"password":password}, function(err, row) {
        if (!err && row) {
          result= {
            "code" : "20000",
            "msg" : "密码修改成功"
          }
        } else {
          status = 400;
          result= {
            "code" : "20001",
            "msg" : "密码修改失败"
          }
        }
        callback();
      });
    };

    this.status = status;
    this.body = result;
  });

  /**
  *@desc 用户修改用户头像
  *@param 用户id
  *@author fanxd
  */
  $.put("/users/change/avatar/:id", function*(next) {
    var self = this;

    //将session放入ejs渲染数据中
    self.state.session = self.session;
    //admin 或 manager 角色才可访问
    if (!self.session.user) {
      self.redirect('/login');
      return;
    }

    var id = this.params.id;
    var avatar = this.request.fields.avatar;
    var status = 200;
    var result = {};

    var userModel = this.model("user");
    yield function(callback) {
      userModel.findOneAndUpdateRow({ _id: id }, {"avatar":avatar}, function(err, row) {
        if (!err && row) {
          result= {
            "code" : "20000",
            "msg" : "头像设置成功"
          }
        } else {
          status = 400;
          result= {
            "code" : "20001",
            "msg" : "头像设置失败"
          }
        }
        callback();
      });
    };

    this.status = status;
    this.body = result;
  });



  //业务组
  $.get("/users/groups", function*(next){
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

    var userGroupModel = this.model("user_group");
    yield function(callback) {
      userGroupModel.getRowsCount(params, function(err, count) {
        totalPage = Math.ceil(count / limit);
        userGroupModel.getPagedRows(params, offset, limit, {
          created: -1
        }, function(err, rows) {
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

    result.title =  '业务组';

    var common = self.library("common");
    result.common = common;

    yield self.render('/users/groups', result);
  });

  //创建业务组
  $.post("/users/groups", function*(next) {
    var self = this;
    var _params = this.request.fields;

    var status = 201;
    var result = {};
    //创建
    yield function(callback) {
      var userGroupModel = this.model("user_group");
      userGroupModel.createRow(_params, function(err, row) {
        if (!err && row) {
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

  //编辑业务组
  $.put("/users/groups/:_id", function*(next) {
    var _id = this.params._id;
    var _params = this.request.fields;

    var status = 201;
    var result = {};

    var userGroupModel = this.model("user_group");
    yield function(callback) {
      userGroupModel.findOneAndUpdateRow({
        _id: _id
      }, _params, function(err, row) {
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

  //业务组信息
  $.get("/users/groups/:_id", function*(next) {
    var self = this;
    var _id = this.params._id;

    var status = 200;
    var result = {};
    var userGroupModel = this.model("user_group");
    yield function(callback) {
      userGroupModel.getRow({ _id: _id }, function(err, row) {
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

  //删除业务组
  $.delete("/users/groups/:_id", function*(next) {
    var self = this;
    var result = {};

    var _id = this.params._id;

    var userGroupModel = this.model("user_group");
    yield function(callback) {
      userGroupModel.deleteRow({
        _id: _id
      }, function(err, row) {
        if (!err && row) {
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
  * @desc 验证业务组名称是否存在
  * @param name 业务组名称（精确查询）
  * @author wts
  */
  $.get("/users/groups/validate/:name", function *(next) {
    var self = this;
    //将session放入ejs渲染数据中
    self.state.session = self.session;
    //admin 或 manager 角色才可访问
    if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
      self.redirect('/login');
      return;
    }
    var usergroupname = this.params.name;
    var params={};
    var result = {};
    var status = 200;
    if(usergroupname !=''){
      params.name = usergroupname;
    }

    var userGroupModel = this.model("user_group");
    yield function(callback) {
      userGroupModel.getRowsCount(params,function(err,count){
        if(err){
          status = 400;
          result="业务组名称失败";
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


  //角色
  $.get("/users/roles", function*(next){
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

    var roleModel = this.model("role");
    yield function(callback) {
      roleModel.getRowsCount(params, function(err, count) {
        totalPage = Math.ceil(count / limit);
        roleModel.getPagedRows(params, offset, limit, {
          created: -1
        }, function(err, rows) {
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

    result.title =  '角色';

    var common = self.library("common");
    result.common = common;

    yield self.render('/users/roles', result);
  });

  //创建角色
  $.post("/users/roles", function*(next) {
    var self = this;
    var _params = this.request.fields;

    var status = 201;
    var result = {};

    //创建
    yield function(callback) {
      var roleModel = this.model("role");
      roleModel.createRow(_params, function(err, row) {
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

  //编辑角色
  $.put("/users/roles/:_id", function*(next) {
    var _id = this.params._id;
    var _params = this.request.fields;

    var status = 201;
    var result = {};

    var roleModel = this.model("role");
    yield function(callback) {
      roleModel.findOneAndUpdateRow({
        _id: _id
      }, _params, function(err, row) {
        if (!err && row) {
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

  //角色信息
  $.get("/users/roles/:_id", function*(next) {
    var self = this;
    var _id = this.params._id;

    var status = 200;
    var result = {};
    var roleModel = this.model("role");
    yield function(callback) {
      roleModel.getRow({ _id: _id }, function(err, row) {
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

  //删除角色
  $.delete("/users/roles/:_id", function*(next) {
    var self = this;
    var result = {};

    var _id = this.params._id;

    var roleModel = this.model("role");
    yield function(callback) {
      roleModel.deleteRow({
        _id: _id
      }, function(err, row) {
        if (!err && row) {
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
  * @desc 验证角色名称是否存在
  * @param name 角色名称（精确查询）
  * @author wts
  */
  $.get("/users/roles/validate/:name", function *(next) {
    var self = this;
    //将session放入ejs渲染数据中
    self.state.session = self.session;
    //admin 或 manager 角色才可访问
    if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
      self.redirect('/login');
      return;
    }
    var userrolename = this.params.name;
    var params={};
    var result = {};
    var status = 200;
    if(userrolename !=''){
      params.name = userrolename;
    }

    var roleModel = this.model("role");
    yield function(callback) {
      roleModel.getRowsCount(params,function(err,count){
        if(err){
          status = 400;
          result="角色名称失败";
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

  //个人设置
  $.get("/users/setting", function*(next){
    var self = this;

    //将session放入ejs渲染数据中
    self.state.session = self.session;

    var params = {};
    var result = {};
    var status = 200;

    yield function(callback) {
      callback();
    }

    result.title =  '个人设置';
    yield self.render('/users/setting', result);
  });


  /**
  *@desc  批量更新用户信息
  *@param csv文件
  *@author
  *
  */
  $.post("/batch/import/user",function*(next){
    var self = this;
    var status = 200;
    var result = {};

    var config = {};
    var userConfigModel = this.model("user_config");
    yield function(callback){
      userConfigModel.getRow({},function(err, row) {
        if(!err && row){
          config = row;
        }else{
          status = 400;
          // console.log(err)
        }
        callback();
      });
    }

    if(JSON.stringify(paramss) == "{}"){
      this.status = status;
      this.body = {
        code : "20002",
        msg : "用户没有配置表头信息"
      };
      return;
    }

    if (this.request.files && this.request.files[0].size > 0) {
      //文件类型
      var file_path = this.request.files[0].path;
      var userModel=this.model("user");
      var importCallstat = self.library("import_callstat");
      var paramss =  importCallstat.importUser(file_path,config);
      if(JSON.stringify(paramss) == "[]"){
        this.status = status;
        this.body = {
          code : "20003",
          msg : "读取文件失败,请检查配置表头信息"
        };
        return;
      }
      var crypto = require('crypto');
      yield function(callback){
        paramss.forEach(function(params){
          params.role = "omni";
          var md5 = crypto.createHash('md5');
          md5.update(String(params.password), 'utf8');
          params.password = md5.digest('hex');
          userModel.findOneAndUpdateRow({sit_number : params.sit_number},params, function(err, row) {
            if(!err && row){
              result = {
                code : "20000",
                msg : "批量导入成功"
              };
            }else{
              status = 400;
              console.log(err)
            }
            callback();
          });
        });
      }
    }else{
      result = {
        code : "20004",
        msg : "请上传文件！"
      };
    }

    this.status = status;
    this.body = result;

  });


  /**
  *@desc  用户配置信息维护（插入更新）
  *@param 用户配置信息
  *@author
  *
  */
  $.post("/users/userconfig",function*(next){
    var self = this;
    var status = 200;
    var result = {};

    var params = this.request.fields;
    var userConfigModel = this.model("user_config");
    yield function(callback){
      userConfigModel.deleteRow({},function(err,row){
        if(err){
          console.log(err);
        }
      });
      userConfigModel.findOneAndUpdateRow({config_name : params.config_name},params,function(err, row) {
        if(!err && row){
          result = {
            code : "20000",
            msg : "配置更新成功"
          };
        }else{
          status = 400;
          console.log(err)
        }
        callback();
      });
    }

    this.status = status;
    this.body = result;

  });


};
