'use strict';
var MixedSchema = require('./mixed')
  , Promise = require('promise/lib/es6-extensions')
  , isAbsent = require('./util/isAbsent')
  , { mixed, array: locale } = require('./locale.js')
  , { inherits, collectErrors } = require('./util/_');

let scopeError = value => err => {
  err.value = value
  throw err
}

let hasLength = value => !isAbsent(value) && value.length > 0;

module.exports = ArraySchema

function ArraySchema(){
  if (!(this instanceof ArraySchema))
    return new ArraySchema()

  MixedSchema.call(this, { type: 'array'})

  this.withMutation(() => {
    this.transform(function(values) {
      if (typeof values === 'string')
        try {
          values = JSON.parse(values)
        } catch (err){ values = null }

      return this.isType(values) ? values : null
    })
  })
}

inherits(ArraySchema, MixedSchema, {

  _typeCheck(v){
    return Array.isArray(v)
  },

  _cast(_value, _opts) {
    var value = MixedSchema.prototype._cast.call(this, _value)

    //should ignore nulls here
    if (!this._typeCheck(value) || !this._subType)
      return value;

    return value.map(v => this._subType.cast(v, _opts))
  },

  _validate(_value, _opts, _state){
    var errors = []
      , context, subType, schema, endEarly, recursive;

    _state    = _state || {}
    context   = _state.parent || (_opts || {}).context
    schema    = this._resolve(context)
    subType   = schema._subType
    endEarly  = schema._option('abortEarly', _opts)
    recursive = schema._option('recursive', _opts)

    return MixedSchema.prototype._validate.call(this, _value, _opts, _state)
      .catch(endEarly ? null : err => {
        errors = err
        return err.value
      })
      .then(function(value){
        if (!recursive || !subType || !schema._typeCheck(value) ) {
          if (errors.length) throw errors[0]
          return value
        }

        let result = value.map((item, key) => {
          var path  = (_state.path || '') + '[' + key + ']'
            , state = { ..._state, path, key, parent: value};

          return subType._validate(item, _opts, state)
        })

        result = endEarly
          ? Promise.all(result).catch(scopeError(value))
          : collectErrors(result, value, _state.path, errors)

        return result.then(() => value)
      })
  },

  of(schema){
    var next = this.clone()
    next._subType = schema
    return next
  },

  required(msg) {
    var next = MixedSchema.prototype.required.call(this, msg || mixed.required);

    return next.test(
        'required'
      , msg || mixed.required
      , hasLength
    )
  },

  min(min, message){
    message = message || locale.min

    return this.test({
      message,
      name: 'min',
      exclusive: true,
      params: { min },
      test(value) {
        return isAbsent(value) || value.length >= this.resolve(min)
      }
    })
  },

  max(max, message){
    message = message || locale.max
    return this.test({
      message,
      name: 'max',
      exclusive: true,
      params: { max },
      test(value) {
        return isAbsent(value) || value.length <= this.resolve(max)
      }
    })
  },

  compact(rejector){
    let reject = !rejector
      ? v => !!v
      : (v, i, a) => !rejector(v, i, a);

    return this.transform(values => values != null ? values.filter(reject) : values)
  }
})
