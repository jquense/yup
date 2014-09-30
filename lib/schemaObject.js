var Clank = require('clank')
  , interpolate = require('./util/interpolate')
  , _ = require('lodash')
  
var SchemaType = module.exports = Clank.Object.extend({

  constructor: function SchemaType(){
    this._activeTests = {}
    this.validations = [];

    Clank.Object.call(this)
  },

  clone: function(){
    return this.constructor.create({
      validations: this.validations.slice(),
      subtype: this.subtype
    })
  },

  cast: _.identity,

  //-- validations
  isValid: function(value, key) {
    this.errors = [];

    return _.every(this.validations, function(fn){
      return fn(value, key)
    }, this)
  },

  validation: function(msg, options, fn, name){
    var self = this
      , msgFn = interpolate(msg || '${name} Field invalid');

    if( typeof options === 'function'){
      name = fn
      fn = options
      options = {}
    }

    if( !name || !_.has(self._activeTests, name) ){
      if( name ) self._activeTests[name] = true

      self.validations.push(function(value, key) { 
        var valid = fn.call(self, value) 
        if(!valid) self.errors.push(msgFn(_.extend({ name: key || 'this'}, options)))
        return valid
      })
    }

    return this
  },

  required: function(msg){
     msg = msg || '${name} field is required'
    return this.validation(msg, function(value, params){
      return val != null
    }, 'required')
  }
})


