var Clank = require('clank')
  , _ = require('lodash')
  , DAOObject = require('./dataAccessObject')
  
var defaultOptions = {
  lazy: false
}

var AbstractField = module.exports = DAOObject.extend({
  
  constructor: function AbstractField(options){
    _.extend(this, defaultOptions, options || {})
    Clank.Object.call(this)
    this.errors = []
  },

  required: Clank.required,

  isValid: function(value) {
    var self = this;
    
    this.errors = [];

    return _.every(this.validations, function(obj){
      var valid = obj.isValid(value, self)
      if(!valid) self.errors.push(obj.message)
      return valid
    })
  }

})

// AbstractField.setCompositionStrategy({
//   validations: Clank.concat()
// })

