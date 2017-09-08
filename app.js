var koa = require('koa');
var app = new koa();

//config
var config = require('config');
global.config = config;

//body parser
app.use(require('koa-better-body')({ "jsonLimit":"50mb","formLimit":"50mb" }));

//library
app.use(require('./plugins/library')());

//redis
app.use(require('./plugins/redis')(config.get('redis')));

//elasticsearch
app.use(require('./plugins/elasticsearch')(config.get('elasticsearch')));

//session
app.keys = ['msdfjljknpsfmsmgnlskfsdmlskg'];
var session = require('koa-generic-session');
var redisStore = require('koa-redis');
app.use(session({
  key:'sid',
  store: redisStore({
      host:config.get('redis').host,
      port:config.get('redis').port
  })
}));

//ejs
var render = require('koa-ejs');
var path = require('path');
render(app, {
    root: path.join(__dirname, 'views'),
    layout: 'layout',
    viewExt: 'ejs',
    cache: false,
    debug: true
});

//static server
var staticCache = require('koa-static-cache');
app.use(staticCache(__dirname + '/public', {
  maxAge: 365 * 24 * 60 * 60
}));

//authantication && authorization
app.use(require('./plugins/authantication')({
    enabled: false,
    debug: true,
    types: {
        application: {
            keys: {
                '123': '1380989044'
            },
            urls: ['/projects/:id']
        },
        user: {
            secret: 'sdfjksdfjklsdf',
            urls: []
        }
    }
}));

//mongodb
var mongodb_conf = config.get('mongodb');
mongodb_conf['schemas']=__dirname +'/models';
app.use(require('./plugins/mongoose')(mongodb_conf));

//token
app.use(require('./plugins/token')({
    secret: 'sdfsdfsdfkljklsjdkflhlknsjfk'
}));

//validator
app.use(require('./plugins/validator')({

}));

//routers
var router = require('koa-router')();
app.use(router.routes()).use(router.allowedMethods());

function loadActions(dir) {
    var fs = require('fs');
    var path = require('path');
    var files = fs.readdirSync(dir);
    for (var file in files) {
        var p = dir + "/" + files[file];
        var stat = fs.lstatSync(p);
        if (stat.isDirectory() == true) {
            loadActions(p);
        } else {
            if (path.extname(p) == '.js') {
                require(p)(router);
            }
        }
    }
}
loadActions(__dirname + "/actions");

//listen
app.listen(config.get('port'));
console.log("# listening on port " + config.get('port'));
