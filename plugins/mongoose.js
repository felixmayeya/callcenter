var glob = require("glob")
var util = require('util')
var mongoose   = require('mongoose');

var middleware = module.exports = options => {
    mongoose = options.mongoose ? options.mongoose : mongoose

    middleware.models = {}
    if (options.schemas) {
      mongoose.Promise = global.Promise;  
        middleware.db = mongoose.connect(options.host, options.extra, function(err){
              if (err) throw err;
              console.log('# mongodb connected.');
           }
        );

        var schemas = options.schemas + (options.schemas.lastIndexOf('/') === (options.schemas.length - 1) ? '' : '/')
        var files = glob.sync(schemas + '/**/*.js')
        files.map(file => {
            var path = require('path');
            var model = path.basename(file, '.js').toLowerCase();
            var schema = require(file)
            middleware.models[model] = middleware.db.model(model, schema)
        });
    }

    return function* (next) {
        this.model = model => {
            try {
                return middleware.model(middleware.db, model)
            } catch(err) {
                this.throw(400, err.message)
            }
        }
        this.document = (model, document) => new (this.model(model))(document)
        yield next
    }
}

middleware.model = (database, model) => {
    var name = model.toLowerCase()
    if (!middleware.models.hasOwnProperty(name)) {
        throw new Error(util.format('Model not found: %s.%s', database, model))
    }
    return database.model(model, middleware.models[name].schema)
}

middleware.document = (database, model, document) => new (middleware.model(database, model))(document)
middleware.mongoose = mongoose
