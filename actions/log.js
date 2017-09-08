module.exports = function ($){

    $.get("/admin/logs", function *(next) {
      var self = this;

      if(!self.session.user || self.session.user.role!= 'admin'){
        self.redirect('/admin/user/login');
        return;
      }

      var _params=this.request.query;
      var offset =_params.offset ? _params.offset : 0;
      var limit = _params.limit ? _params.limit : config.get("limit");
      var result = {};
      var status = 200;
      var params = {};

      var data = {};
      var logModel=this.model("log");
      yield function(callback) {
            logModel.getRowsCount(params, function(err, count) {
                totalPage = Math.ceil(count / limit);
                logModel.getPagedRows(params, offset, limit,{ created: -1}, function(err, rows) {
                    if(err) {
                      status=400;
                    }else{
                      data = {
                          rows: rows,
                          offset: offset,
                          limit:limit,
                          totalPage: totalPage,
                          title: '日志管理'
                      };
                    }
                    callback();
                });
            });
       }

       var common = self.library("common");
       data.common = common;

       yield self.render('admin_logs', data);
    });
};
