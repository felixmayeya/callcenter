
module.exports = function($) {
  var fs = require('fs');
  var exec = require('child_process').exec;
  $.get("/thinkit", function *(next) {
    exec("sh "+run.sh+" "+file_path+" "+path, function(err,stdout,stderr){
      if(err) {
        console.log(stderr);
      } else {
        console.log("成功");
        explorer('/home/uploadfile/xml_result');
      }
    });
  });

  /**
  *@desc 获取规则
  *@param systemid 系统id rulename 规则库名称 username 质检对象名称
  *@author wts
  */
  $.get("/thinkit/:systemid/:rulename/:username", function*(next){
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
    if(this.params.systemid !=''){
      params.system = this.params.systemid;
    }
    if(this.params.rulename !=''){
      params.rule_base = this.params.rulename;
    }
    if(this.params.username !=''){
      params.user = this.params.username;
    }
    var rule = {};
    var result = [];
    var ruleScoreModel = this.model('rule_score');
    var ruleModel = this.model('rule');
    yield function(callback) {
      ruleScoreModel.getRows(params,function(err,rows){
        if(err){
          status = 400;
          result="获取规则内容失败";
        }else{
          rows.forEach(function(row){
            rule.score=row.score;
            var ruleid=row.rule;
            ruleModel.getRow({ _id: ruleid }, function(err, row) {
              if (!err && row) {
                rule.content = row.content;
                rule.parser_content = row.parser_content;
                result.push(rule);
              } else {
                status = 404;
              }
              callback();
            });
          })
        }
      });
    }
    this.status = status;
    this.body = result;
  })

}
