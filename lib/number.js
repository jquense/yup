'use strict';
var SchemaObject = require('./mixed')
  , locale = require('./locale.js').number
  , _ = require('lodash')


var _Number = module.exports = SchemaObject.extend({

  constructor: function(){
    if ( !(this instanceof _Number)) return new _Number()
    SchemaObject.call(this)

    this._type = 'number'

    // if ( !_.has(this, '_default') )
    //   this._default = 0
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
      {  hashKey: 'required',  message:  msg || locale.required },
      function(v){
        return v != null && this.isType(v)
      })
  },

  min: function(min, msg){
    msg = msg || locale.min

    return this.validation(
        { message: msg, hashKey: 'min', params: { min: min } }
      , function(value){
          return value >= min
        })
  },

  max: function(max, msg){
    msg = msg || locale.max
    return this.validation(
        { message: msg, hashKey: 'max', params: { max: max } }
      , function(value){
          return value <= max
        })
  },

  positive: function(max, msg){
    msg = msg || locale.positive
    return this.min(0, msg)
  },

  negative: function(max, msg){
    msg = msg || locale.negative
    return this.max(0, msg)
  },

  integer: function(msg){
    return this
      .transform(function(v){
        return v | 0;
      })
      .validation(msg, function(val){
        return val === (val | 0);
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
  }

})