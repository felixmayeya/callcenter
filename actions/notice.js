/**
*@desc 消息通知
*@author fanxd
*/
module.exports = function($) {


	$.get("/notices", function*(next){
		var self = this;
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user) {
			self.redirect('/login');
			return;
		}

		var result = {};
		var params = {};
		var _params = this.request.query;

		var status = 200;
		var offset = _params.offset ? _params.offset : 0;
		var limit = _params.limit ? _params.limit : config.get("limit");
		var start_time = _params["startTime"]? _params["startTime"]  : "";
		var end_time = _params["endTime"]? _params["endTime"] : "";
		if(_params["status"]){
			params.status = _params.status;
		}

		if(start_time !='' && end_time !=''){
			params["created"] = { "$gte": parseInt(start_time), "$lt": parseInt(end_time)};
		}

		var noticeModel = this.model("notice");
		var totalPage = {};
		yield function(callback) {
			noticeModel.getRowsCount(params, function(err, count) {
				totalPage = Math.ceil(count / limit);
				callback();
			});
		}

		yield function(callback) {
			noticeModel.getPagedRows(params, offset, limit, {
				created: -1
			}, function(err, rows) {
				if (err) {
					status = 400;
				} else {
					result = {
						rows: rows,
						offset: offset,
						limit: limit,
						status:_params.status,
						start_time:start_time,
						end_time:end_time,
						totalPage: totalPage,
					};
				}
				callback();
			});
		}

		result.title =  '消息通知';

		result.common = self.library("common");
		yield self.render('notices/notices', result);
	});

	/**
	*@desc 修改消息状态
	*@param 消息id数组
	*@author fanxd
	*/
	$.post("/notices/update",function*(next){
		var self = this;
		var status = 200;
		var result = {};
		//将session放入ejs渲染数据中
		self.state.session = self.session;
		//admin 或 manager 角色才可访问
		if (!self.session.user || !(self.session.user.role == 'admin' || self.session.user.role == 'manager')) {
			self.redirect('/login');
			return;
		}

		var params = this.request.fields;

		yield function(callback){
			var noticeModel = this.model("notice");
			params.forEach(function(id){
				noticeModel.findByIdAndUpdateRow(id,{ status : 1},function(err,row){
					if(!err && row){
						stauts = 200;
						result={
							code : "20000",
							msg : "标记成功"
						}
					}else{
						status =400;
						result={
							code : "20001",
							msg : "标记失败"
						}
					}
					callback();
				});
			});
		}
		this.status = status;
		this.body = result;
	});


}
