var SchemaObject = require('../schemaObject')
  , CastError = require('../errors/CastError')
  , isoParse = require('../util/isodate')
  , _ = require('lodash')


var _Date = module.exports = SchemaObject.extend({

  constructor: function(){
    if ( !(this instanceof _Date)) return new _Date()
    SchemaObject.call(this)

    this._type = 'date'
    if ( !_.has(this, '_default') )
      this._default = function(){ return new Date }
  },

  isType: function(v) { 
    if( this._nullable && v === null) return true
    return _.isDate(v)
  },

  _coerce: function(value) {
    if(value == null ) return value
    if(_.isDate(value) ) return new Date(value)

    value = isoParse(value)
    return value ? new Date(value) : null
  },

  required: function(msg){
    return this.validation(
      {  hashKey: 'required',  message:  msg || '${path} is a required field' },
      _.isDate)
  },

  min: function(min, msg){
    var limit = this.cast(min);
    msg = msg || '${path} field must be later than ${min}'

    if(!this.isType(limit)) 
      throw TypeError('min must be a Date or a value that can be parsed to a Date')

    return this.validation(
        { message: msg, hashKey: 'min', params: { min: min } }
      , function(value){
          var val = this.cast(value)
          return val && (val >= limit)
        })
  },

  max: function(max, msg){
    var limit = this.cast(max);

    msg = msg || '${path} field must be at earlier than ${max}'
    if(!this.isType(limit)) 
      throw TypeError('max must be a Date or a value that can be parsed to a Date')
    
    return this.validation(
        { message: msg, hashKey: 'max', params: { max: max } }
      , function(value){
          var val = this.cast(value)
          return val <= limit
        })
  }

})