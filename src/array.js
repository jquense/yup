import inherits from './util/inherits';
import isAbsent from './util/isAbsent';
import MixedSchema from './mixed';
import { mixed, array as locale } from './locale.js';
import runValidations, { propagateErrors } from './util/runValidations';


let hasLength = value => !isAbsent(value) && value.length > 0;

export default ArraySchema

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
    let errors = []
    let path = options.path
    let subType   = this._subType
    let endEarly  = this._option('abortEarly', options)
    let recursive = this._option('recursive', options)

    return MixedSchema.prototype._validate
      .call(this, _value, options)
      .catch(propagateErrors(endEarly, errors))
      .then((value) => {
        if (!recursive || !subType || !this._typeCheck(value) ) {
          if (errors.length) throw errors[0]
          return value
        }

        let validations = value.map((item, idx) => {
          var path  = (options.path || '') + '[' + idx + ']'

          // object._validate note for isStrict explanation
          var innerOptions = {
            ...options,
            path,
            strict: true,
            parent: value
          };

          if (subType.validate)
            return subType.validate(item, innerOptions)

          return true
        })

        return runValidations({
          path,
          value,
          errors,
          endEarly,
          validations
        })
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
      .default(() => [])
      .transform(val => val === null ? [] : [].concat(val))
  },

  compact(rejector){
    let reject = !rejector
      ? v => !!v
      : (v, i, a) => !rejector(v, i, a);

    return this.transform(values => values != null ? values.filter(reject) : values)
  }
})
