var SchemaObject = require('./mixed')
  , _ = require('lodash')


var _Number = module.exports = SchemaObject.extend({

  constructor: function(){
    if ( !(this instanceof _Number)) return new _Number()
    SchemaObject.call(this)

    this_type = 'number'

    if ( !_.has(this, '_default') )
      this._default = 0
  },

  isType: function(v) { 
    if( this._nullable && v === null) return true
    return _.isNumber(v) && !_.isNaN(v) 
  },

  _coerce: function(value, nullable) {
    if ( value == null )       return value
    if ( this.isType(value) )  return value
    if ( _.isBoolean(value) )  return value ? 1 : 0

    return _.isDate(value) ? +value : parseFloat(value)
  },

  required: function(msg){
    return this.validation(
      {  hashKey: 'required',  message:  msg || '${path} is a required field' },
      function(v){ 
        return v != null && this.isType(v)
      })
  },

  min: function(min, msg){
    msg = msg || '${path} must be at least ${min}'

    return this.validation(
        { message: msg, hashKey: 'min', params: { min: min } }
      , function(value){
          return value >= min
        })
  },

  max: function(max, msg){
    msg = msg || '${path} must be less or equal to than ${max}'
    return this.validation(
        { message: msg, hashKey: 'max', params: { max: max } }
      , function(value){
          return value <= max
        })
  },

  integer: function(){
    return this.transform(function(v){
      return v | 0;
    })
  },

  round: function(method){
    var avail = ['ceil', 'floor', 'round']
    method = (method && method.toLowerCase()) || 'round'
    
    if( !_.contains(avail, method.toLowerCase()) ) 
      throw new TypeError('Only valid options for round() are: ' + avail.join(', '))

    return this.transform(function(v){
      return Math[method](v);
    })
  },

  positive: function(max, msg){
    msg = msg || '${path} must be a positive number'
    return this.min(0, msg)
  },

  negative: function(max, msg){
    msg = msg || '${path} must be a negative number'
    return this.max(0, msg)
  },
})