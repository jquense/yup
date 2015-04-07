'use strict';
var MixedSchema = require('./mixed')
  , isoParse = require('./util/isodate')
  , locale = require('./locale.js').date
  , { isDate, inherits } = require('./util/_');

module.exports = DateSchema

function DateSchema(){
  if ( !(this instanceof DateSchema)) return new DateSchema()

  MixedSchema.call(this, { type: 'date'})
}

inherits(DateSchema, MixedSchema, {

  isType(v) {
    if( this._nullable && v === null) return true
    return isDate(v)
  },

  _coerce(value) {
    if(value == null ) return value
    if(isDate(value) ) return new Date(value)

    value = isoParse(value)
    return value ? new Date(value) : null
  },

  required(msg){
    return this.validation(
      {  hashKey: 'required',  message:  msg || locale.required },
      isDate)
  },

  min(min, msg){
    var limit = this.cast(min);
    msg = msg || locale.min

    if(!this.isType(limit))
      throw new TypeError('min must be a Date or a value that can be parsed to a Date')

    return this.validation(
        { message: msg, hashKey: 'min', params: { min: min } }
      , function(value){
          var val = this.cast(value)
          return val && (val >= limit)
        })
  },

  max(max, msg){
    var limit = this.cast(max);

    msg = msg || locale.max
    if(!this.isType(limit))
      throw new TypeError('max must be a Date or a value that can be parsed to a Date')

    return this.validation(
        { message: msg, hashKey: 'max', params: { max: max } }
      , function(value){
          var val = this.cast(value)
          return val <= limit
        })
  }

})