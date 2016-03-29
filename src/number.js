'use strict';
var SchemaObject = require('./mixed')
  , locale = require('./locale.js').number
  , isAbsent = require('./util/isAbsent')
  , { isDate, inherits } = require('./util/_');

module.exports = NumberSchema

let isInteger = val => isAbsent(val) || val === (val | 0)

function NumberSchema(){
  if ( !(this instanceof NumberSchema))
    return new NumberSchema()

  SchemaObject.call(this, { type: 'number' })

  this.withMutation(() => {
    this.transform(function(value) {
      if (this.isType(value)) return value
      if (typeof value === 'boolean') return value ? 1 : 0

      return isDate(value) ? +value : parseFloat(value)
    })
  })
}

inherits(NumberSchema, SchemaObject, {

  _typeCheck(v) {
    if ( typeof v === 'number' && !(v !== +v) ) return true
    if ( typeof v === 'object' && v instanceof Number ) return true

    return false
  },

  min(min, msg) {
    return this.test({
      name: 'min',
      exclusive: true,
      params: { min },
      message: msg || locale.min,
      test(value) {
        return isAbsent(value) || value >= this.resolve(min)
      }
    })
  },

  max(max, msg) {
    return this.test({
      name: 'max',
      exclusive: true,
      params: { max },
      message: msg || locale.max,
      test(value) {
        return isAbsent(value) || value <= this.resolve(max)
      }
    })
  },

  positive(msg) {
    return this.min(0, msg || locale.positive)
  },

  negative(msg) {
    return this.max(0, msg || locale.negative)
  },

  integer(msg) {
    msg = msg || locale.integer

    return this
      .transform(value => !isAbsent(value) ? (value | 0) : value)
      .test('integer', msg, isInteger)
  },

  round(method) {
    var avail = ['ceil', 'floor', 'round']
    method = (method && method.toLowerCase()) || 'round'

    if( avail.indexOf(method.toLowerCase()) === -1 )
      throw new TypeError('Only valid options for round() are: ' + avail.join(', '))

    return this.transform(value => !isAbsent(value) ? Math[method](value) : value)
  }
})
