'use strict';
var SchemaObject = require('./mixed')
  , Promise = require('es6-promise').Promise
  , locale = require('./locale.js').array
  , _ = require('lodash')


var _Array = module.exports = SchemaObject.extend({

  constructor: function(){
    if ( !(this instanceof _Array)) return new _Array()
    SchemaObject.call(this)

    this._type = 'array'
  },

  isType: function(v) {
    if( this._nullable && v === null) return true
    return Array.isArray(v)
  },

  _coerce: function(values) {
    if (typeof values === 'string') {
      try {
        values = JSON.parse(values)
      } catch (err){ values = null }
    }

    if(values === undefined )
      return

    if( this.isType(values) )
        return this._subType
          ? values.map(this._subType.cast, this._subType)
          : values

    return null
  },

  _validate: function(_value, _opts, _state){
    var context = (_opts || {}).context || _state.parent
      , subType, schema;

    _state  = _state || {}
    schema  = this._resolve(context)
    subType = schema._subType

    return SchemaObject.prototype._validate.call(this, _value, _opts, _state)
      .then(function(value){

        if ( !subType ) return value

        return Promise
          .all(value.map(function(item, key)  {
            var path  = (_state.path || '') + '['+ key + ']'
              , state = _.defaults({ path:path, key:key, parent: value }, _state);

            return subType._validate(item, _opts, state)
          }))
          .then(function()  {return value;})
      })
  },

  of: function(schema){
    var next = this.clone()
    next._subType = schema
    return next
  },

  required: function(msg){
    return this.validation(
      {  hashKey: 'required',  message:  msg || locale.required },
      function(value){
        return value && this.isType(value) && !!value.length
      })
  },

  min: function(min, msg){
    msg = msg || locale.min

    return this.validation(
        { message: msg, hashKey: 'min', params: { min: min } }
      , function(value){
          return value && value.length >= min
        })
  },

  max: function(max, msg){
    msg = msg || locale.max
    return this.validation(
        { message: msg, hashKey: 'max', params: { max: max } }
      , function(value){
          return value && value.length <= max
        })
  },

  compact: function(rejector){
    return this.transform(function(values){
      return values.filter(rejector ? reject : compact)
    })

    function reject(v,i,a){
      return !rejector.call(this, v, i, a)
    }
  }
})

function compact(v){
  return !!v
}