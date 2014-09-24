var Clank = require('clank')
  , _ = require('lodash')
  
var defaultOptions = {
  lazy: false,
  validations: null
}

var AbstractField = module.exports = Clank.Object.extend({
  
  constructor: function AbstractField(options){
    Clank.Object.call(this)
    _.defaults(this, defaultOptions)
    this.errors = []
  },

  cast: Clank.required,

  default: Clank.required,

  required: Clank.required,

  validate: function(value) {
    var self = this;
    
    this.errors = [];

    return _.every(this.validations, function(obj){
      var valid = obj.validate(value, self)
      if(!valid) self.errors.push(obj.message)
      return valid
    })
  }

})

// AbstractField.setCompositionStrategy({
//   validations: Clank.concat()
// })

