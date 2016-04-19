'use strict';
var MixedSchema = require('./mixed')
  , Promise = require('universal-promise')
  , isAbsent = require('./util/isAbsent')
  , { mixed, array: locale } = require('./locale.js')
  , { inherits, collectErrors } = require('./util/_');

let scopeError = value => err => {
  err.value = value
  throw err
}

let hasLength = value => !isAbsent(value) && value.length > 0;

module.exports = ArraySchema

function ArraySchema(type) {
  if (!(this instanceof ArraySchema))
    return new ArraySchema(type)

  MixedSchema.call(this, { type: 'array'})

  this._subType = null;

  this.withMutation(() => {
    this.transform(function(values) {
      if (typeof values === 'string')
        try {
          values = JSON.parse(values)
        } catch (err){ values = null }

      return this.isType(values) ? values : null
    })

    if (type)
      this.of(type)
  })
}

inherits(ArraySchema, MixedSchema, {

  _typeCheck(v){
    return Array.isArray(v)
  },

  _cast(_value, _opts) {
    var value = MixedSchema.prototype._cast.call(this, _value, _opts)

    //should ignore nulls here
    if (!this._typeCheck(value) || !this._subType)
      return value;

    return value.map(v => this._subType.cast(v, _opts))
  },

  _validate(_value, options = {}) {
    var errors = []
      , subType, endEarly, recursive;

    subType   = this._subType
    endEarly  = this._option('abortEarly', options)
    recursive = this._option('recursive', options)

    return MixedSchema.prototype._validate.call(this, _value, options)
      .catch(endEarly ? null : err => {
        errors = err
        return err.value
      })
      .then((value) => {
        if (!recursive || !subType || !this._typeCheck(value) ) {
          if (errors.length) throw errors[0]
          return value
        }

        let result = value.map((item, key) => {
          var path  = (options.path || '') + '[' + key + ']'

          // object._validate note for isStrict explanation
          var innerOptions = { ...options, path, key, strict: true, parent: value };

          if (subType.validate)
            return subType.validate(item, innerOptions)

          return true
        })

        result = endEarly
          ? Promise.all(result).catch(scopeError(value))
          : collectErrors(result, value, options.path, errors)

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

  ensure() {
    return this
      .default([])
      .transform(val => val == null ? [] : [].concat(val))
  },

  compact(rejector){
    let reject = !rejector
      ? v => !!v
      : (v, i, a) => !rejector(v, i, a);

    return this.transform(values => values != null ? values.filter(reject) : values)
  }
})
