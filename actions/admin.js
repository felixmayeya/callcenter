module.exports = function($) {

  //账号登录
  $.get("/admin/login", function*(next) {
    var self = this;
    yield self.render('admin_login', {
      layout: 'layout_login',
      title: '登录'
    });
  });

  $.post("/admin/login", function*(next) {
    var self = this;
    var _params = self.request.fields;

    if (self.validate(_params, {
        username: "required",
        password: "required"
      }).length !== 0) {
      self.status = 400;
      self.body = '参数有误';
      return;
    }

    var adminModel = self.model("admin");

    var username = _params["username"];
    var password = _params["password"];
    var params = {
      username: username,
      password: password
    };

    yield function(callback) {
      adminModel.getRow(params, function(err, row) {
        if (!err && row) {
          self.status = 201;
          self.session.user = row;
          self.body = row;
        } else {
          self.status = 400;
          self.body = {};
        }
        callback();
      });
    }
  });

};
