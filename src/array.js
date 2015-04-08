'use strict';
var MixedSchema = require('./mixed')
  , Promise = require('es6-promise').Promise
  , locale = require('./locale.js').array
  , inherits = require('./util/_').inherits;

module.exports = ArraySchema

function ArraySchema(){
  if ( !(this instanceof ArraySchema)) 
    return new ArraySchema()
  
  MixedSchema.call(this, { type: 'array'})

  this.transforms.push(function(values) {
    if (typeof values === 'string')
      try {
        values = JSON.parse(values)
      } catch (err){ values = null }
    
    if( Array.isArray(values))
        return this._subType
          ? values.map(this._subType.cast, this._subType)
          : values

    return this.isType(values) ? values : null
  })
  
}

inherits(ArraySchema, MixedSchema, {

  _typeCheck(v){
    return Array.isArray(v)
  },

  _validate(_value, _opts, _state){
    var context, subType, schema;

    _state  = _state || {}
    context = _state.parent || (_opts || {}).context
    schema  = this._resolve(context)
    subType = schema._subType

    return MixedSchema.prototype._validate.call(this, _value, _opts, _state)
      .then(function(value){

        if ( !subType || !Array.isArray(value) ) return value

        return Promise
          .all(value.map((item, key) => {
            var path  = (_state.path || '') + '['+ key + ']'
              , state = { ..._state, path, key, parent: value};

            return subType._validate(item, _opts, state)
          }))
          .then(() => value)
      })
  },

  of(schema){
    var next = this.clone()
    next._subType = schema
    return next
  },

  required(msg){
    return this.validation(
      {  hashKey: 'required',  message:  msg || locale.required },
      value => this.isType(value) && !!value.length)
  },

  min(min, msg){
    msg = msg || locale.min

    return this.validation(
        { message: msg, hashKey: 'min', params: { min: min } }
      , value => value && value.length >= min)
  },

  max(max, msg){
    msg = msg || locale.max
    return this.validation(
        { message: msg, hashKey: 'max', params: { max: max } }
      , value => value && value.length <= max)
  },

  compact(rejector){
    let reject = !rejector 
      ? v => !!v 
      : (v, i, a) => !rejector(v, i, a);

    return this.transform(values => values.filter(reject))
  }
})