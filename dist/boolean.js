'use strict';
var SchemaObject = require('./mixed')
  , _ = require('lodash')
  , locale = require('./locale.js').boolean

var _Boolean = module.exports = SchemaObject.extend({

  constructor: function(){
    if ( !(this instanceof _Boolean)) return new _Boolean()
    SchemaObject.call(this)

    this._type = 'boolean'
  },

  isType: function(v) {
    if( this._nullable && v === null) return true
    return isBool(v)
  },

  _coerce: function(value) {
    if(value == null || this.isType(value)) return value
    return (/true|1/i).test(value)
  },

  required: function(msg){
    return this.validation(
      {  hashKey: 'required',  message:  msg || locale.required },
      isBool)
  }

})

function isBool(v){
	return typeof v === 'boolean'
}