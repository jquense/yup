'use strict';
var SchemaObject = require('./mixed')
  , locale = require('./locale.js').number;

var isDate = obj => Object.prototype.toString.call(obj) === '[object Date]'

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
    return typeof v === 'number' && !isNaN(v)
  },

  _coerce: function(value) {
    if ( value == null )       return value
    if ( this.isType(value) )  return value
    if ( typeof value === 'boolean' )  return value ? 1 : 0

    return isDate(value) ? +value : parseFloat(value)
  },

  required: function(msg){
    return this.validation(
        { hashKey: 'required',  message:  msg || locale.required }
      , v => v != null && this.isType(v))
  },

  min(min, msg) {
    msg = msg || locale.min

    return this.validation(
        { message: msg, hashKey: 'min', params: { min: min } }
      , value => value >= min)
  },

  max(max, msg) {
    msg = msg || locale.max
    return this.validation(
        { message: msg, hashKey: 'max', params: { max: max } }
      , value => value <= max)
  },

  positive(max, msg) {
    msg = msg || locale.positive
    return this.min(0, msg)
  },

  negative(max, msg) {
    msg = msg || locale.negative
    return this.max(0, msg)
  },

  integer(msg) {
    msg = msg || locale.integer

    return this
      .transform( v => v | 0)
      .validation(msg, val => val === (val | 0))
  },

  round: function(method){
    var avail = ['ceil', 'floor', 'round']
    method = (method && method.toLowerCase()) || 'round'

    if( avail.indexOf(method.toLowerCase()) === -1 )
      throw new TypeError('Only valid options for round() are: ' + avail.join(', '))

    return this.transform(function(v){
      return Math[method](v);
    })
  }

})