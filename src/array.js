'use strict';
var MixedSchema = require('./mixed')
  , Promise = require('es6-promise').Promise
  , { mixed, array: locale } = require('./locale.js')
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
        
        if ( !subType || !schema._typeCheck(value) ) return value

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

  required(msg) {
    var next = MixedSchema.prototype.required.call(this, msg || mixed.required);

    return next.min(1, msg || mixed.required);
  },

  min(min, message){
    message = message || locale.min

    return this.test({ 
      message, 
      name: 'min', 
      exclusive: true,
      params: { min }, 
      test: value => value && value.length >= min
    })
  },

  max(max, message){
    message = message || locale.max
    return this.test({ 
      message,
      name: 'max',  
      exclusive: true,
      params: { max },
      test: value => value && value.length <= max 
    })
  },

  compact(rejector){
    let reject = !rejector 
      ? v => !!v 
      : (v, i, a) => !rejector(v, i, a);

    return this.transform(values => values != null ? values.filter(reject) : values)
  }
})