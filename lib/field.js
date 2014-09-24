var Clank = require('clank')
  , _ = require('lodash')
  , validators = require('./util/validators')
  
var defaultOptions = {
  lazy: false,
  defaultValue: null,
  required: false
}

module.exports = Clank.Object.extend({
  
  validations: [ 'required' ],

  constructor: function AbstractField(){
    Clank.Object.call(this)
    _.defaults(this, defaultOptions)
  },

  cast: Clank.required,

  default: Clank.required,

  isValidValue: Clank.required,

  validate: function(value) {
    var self = this;

    return _.every(this.validations, function(name){
      return !self[key] || validators[name]( value, self)
    })
  }

})

exports.setCompositionStrategy({
  validations: Clank.concat()
})

