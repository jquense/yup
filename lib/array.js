'use strict';
var SchemaObject = require('./mixed')
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
    return _.isArray(v)
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
          ? _.map(values, this._subType.cast, this._subType)
          : values

    return null
  },

  _validate: function(_value, _opts, _state){
    var context = (_opts || {}).context || _state.parent
      , value   = _value
      , valid, subType, options, schema;

    schema  = this._resolve(context)
    options = _.extend({}, schema._options, _opts)

    if( options.strict !== true ){
      value = schema.cast(value, context)
      options.strict = true //don't re-cast later
    }

    valid   = SchemaObject.prototype._validate.call(schema, value, options, _state)
    subType = schema._subType

    // check that the array values also are valid
    if ( valid && subType){
      options = _.extend({}, schema._options, _opts)

      valid = _.every(value, function(item, idx){
        var path  = (_state.path || '') + '['+ idx + ']'
          , state = _.defaults({ key: idx, path : path, parent: value }, _state)
          , valid = subType._validate(item, options, state)

        if(!valid) schema.errors = schema.errors.concat(subType.errors)
        return valid
      })
    }

    this.errors = schema.errors.slice()
    return valid
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
      return rejector
        ? _.reject(values, rejector)
        : _.compact(values)
    })
  }
})