var SchemaObject = require('./mixed')
  , _ = require('lodash')


var _Boolean = module.exports = SchemaObject.extend({

  constructor: function(){
    if ( !(this instanceof _Boolean)) return new _Boolean()
    SchemaObject.call(this)

    this._type = 'boolean'
    if ( !_.has(this, '_default') )
      this._default = false
  },

  isType: function(v) { 
    if( this._nullable && v === null) return true
    return _.isBoolean(v)
  },

  _coerce: function(value) {
    if(value == null || this.isType(value)) return value
    return /true|1/i.test(value)
  },

  required: function(msg){
    return this.validation(
      {  hashKey: 'required',  message:  msg || '${path} is a required field' },
      _.isBoolean)
  }

})