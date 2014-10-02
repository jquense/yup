
var SchemaObject = require('../schemaObject')
  , _ = require('lodash')

var rtrim  = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
var rEmail = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
var rUrl   = /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;


var _String = module.exports = SchemaObject.extend({

  constructor: function(){
    if ( !(this instanceof _String)) return new _String()
    SchemaObject.call(this)

    this_type = 'string'
    if ( !_.has(this, '_default'))  this._default = '' 
    if ( !_.has(this, '_nullable')) this._nullable = true 
  },

  isType: function(v){
    if( this._nullable && v === null) return true
    return _.isString(v)
  },

  _coerce: function(value, nullable) {
    if(value == null || this.isType(value)) return value
    return value.toString ? value.toString() : '' + value
  },

  required: function(msg){
    return this.validation(
      {  hashKey: 'required',  message:  msg || '${path} is a required field' },
      function(value, params){
        return value && !!value.length
      })
  },

  min: function(min, msg){
    msg = msg || '${path} must be at least ${min} characters'

    return this.validation(
        { message: msg, hashKey: 'min', params: { min: min } }
      , function(value){
          return value && value.length >= min
        })
  },

  max: function(max, msg){
    msg = msg || '${path} must be less than ${max} characters'
    return this.validation(
        { message: msg, hashKey: 'max', params: { max: max } }
      , function(value){
          return value && value.length <= max
        })
  },

  matches: function(regex, msg){
    msg = msg || '${path} must match the following: "${regex}"'

    return this.validation(
        { message: msg, params: { regex: regex } }
      , function(value){
          return regex.test(value)
        })
  },

  email: function(msg){
    msg = msg || '${path} must be a valid email'

    return this.matches(rEmail, msg);
  },

  url: function(msg){
    msg = msg || '${path} must be a valid URL'

    return this.matches(rUrl, msg);
  },

  //-- transforms --
  trim: function(){
    return this.transform(function(v){
      return v.trim ? v.trim() : v.replace(rtrim, "");
    })
  },

  lowercase: function(){
    return this.transform(function(v){
      return v.toLowerCase()
    })
  },

  uppercase: function(){
    return this.transform(function(v){
      return v.toUpperCase()
    })
  }
})