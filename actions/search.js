


module.exports = function($) {

  $.get("/search", function*(next){
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
    var message = _params.name?_params.name:'';
    var index= "callcenter";
    var type= "audios";
    if(message!==''){
      console.log("输入查询"+message)
      //第一种搜索方法
      var params = {
              body: {
                "query": {
                  "query_string" : {
                      "fields" : ["dialog_text"],
                      "query" : message
                      }
                },
                highlight : {
                  "pre_tags": ["<span style='background: #ff0;color:#f00;'>"],
                  "post_tags" : ["</span>"],
                  "fields" : {
                    "dialog_text" : { "fragment_size" : 10000, "number_of_fragments" : 10 }
                  }
                }
              },
            index: index,
            type: type ,
            from:offset,
            size:limit
          };
      yield function(callback) {
        self.elasticsearch.search(params, function (error, response) {
          console.log(response);
          if (!error) {
            var totalPage = Math.ceil(response.hits.total / limit);
            //获取结果
            result.rows=response.hits.hits;
            //总数
            result.total=totalPage;
            //耗时时间
            //  result.max_score=response.hits.max_score;
            result.offset= offset;
            result.limit= limit;
            status=200;
            callback();
          }else{
            console.trace(error.message);
            //获取结果
            result.rows={};
            //总数
            result.total=0;
            //耗时时间
            //  result.max_score=response.hits.max_score;
            result.offset= offset;
            result.limit= limit;
            callback();
          }
        });
      }
    }else{
          //获取结果
          result.rows={};
          //总数
          result.total=0;
          //耗时时间
          //  result.max_score=response.hits.max_score;
          result.offset= offset;
          result.limit= limit;
    }

    result.name=message;
    var systemModel = this.model("system");
    yield function(callback) {
      systemModel.getRows({}, function(err, row) {
        if (!err && row) {
          status = 200;
          var systemList = row;
          result.systemList=systemList;
        }
        callback();
      })
    }
    var userModel=this.model("user");
    yield function(callback) {
      userModel.getRows({'role':'omni'},function(err,row){
        if (!err && row) {
          var userList=row;
          result.userList=userList;
        }
        callback();
      })
    }
    result.operator=self.session.username;
    result.title =  '全文搜索';

    var common = self.library("common");
    result.common = common;
    yield self.render('/search/search', result);
  });
}
