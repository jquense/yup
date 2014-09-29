var Clank = require('clank')
  , _ = require('lodash')
  , DAOObject = require('./dataAccessObject')
  
var defaultOptions = {
  lazy: false
}

var AbstractField = module.exports = DAOObject.extend({
  
  constructor: function AbstractField(options){
    DAOObject.call(this)
    _.defaults(this, defaultOptions)
  },

  required: Clank.required,

  isValid: function(value) {
    var self = this;
    
    this.errors = [];

    return _.every(this.validations, function(obj){
      var valid = obj.isValid(value, self)
      if(!valid) self.errors.push(obj.error)
      return valid
    })
  }
})

