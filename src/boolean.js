'use strict';
var MixedSchema = require('./mixed')
  , locale = require('./locale.js').boolean
  , inherits = require('./util/_').inherits;

let isBool = v => typeof v === 'boolean'

module.exports = BooleanSchema

function BooleanSchema(){
  if (!(this instanceof BooleanSchema)) 
    return new BooleanSchema()
 
  MixedSchema.call(this, { type: 'boolean'})
}

inherits(BooleanSchema, MixedSchema, {

  isType(v) {
    if( this._nullable && v === null) return true
    return isBool(v)
  },

  _coerce(value) {
    if(value == null || this.isType(value)) return value
    return (/true|1/i).test(value)
  },

  required(msg){
    return this.validation(
      {  hashKey: 'required',  message:  msg || locale.required },
      isBool)
  }

})

