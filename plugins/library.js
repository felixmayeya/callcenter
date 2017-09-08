'use strict';

module.exports = function() {
  return function * (next) {
    this.library = function(library){
        try {
            return require("../libraries/"+library)
        } catch(err) {
            this.throw(400, err.message)
        }
    }
    yield next
  }
}
