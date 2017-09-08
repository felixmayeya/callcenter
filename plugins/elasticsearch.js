'use strict';

module.exports = function(options) {
  options = options || {};

  var elasticsearch = require('elasticsearch');
  var client = new elasticsearch.Client({
    host: options.host+":"+options.port,
    httpAuth:''
  });

  return function * (next) {
    this.elasticsearch = client;
    yield next;
  }
}
