'use strict';
var MixedSchema = require('./mixed')
  , isoParse = require('./util/isodate')
  , locale = require('./locale.js').date
  , isAbsent = require('./util/isAbsent')
  , Ref = require('./util/reference')
  , { isDate, inherits } = require('./util/_');

let invalidDate = new Date('')

module.exports = DateSchema

function DateSchema(){
  if ( !(this instanceof DateSchema)) return new DateSchema()

  MixedSchema.call(this, { type: 'date'})

  this.withMutation(() => {
    this.transform(function(value) {
      if (this.isType(value))
        return isDate(value) ? new Date(value) : value

      value = isoParse(value)
      return value ? new Date(value) : invalidDate
    })
  })
}

inherits(DateSchema, MixedSchema, {

  _typeCheck(v) {
    return isDate(v) && !isNaN(v.getTime())
  },

  min(min, msg){
    var limit = min;

    if (!Ref.isRef(limit)) {
      limit = this.cast(min)
      if (!this._typeCheck(limit))
        throw new TypeError('`min` must be a Date or a value that can be `cast()` to a Date')
    }

    return this.test({
      name: 'min',
      exclusive: true,
      message: msg || locale.min,
      params: { min },
      test(value) {
        return isAbsent(value) || value >= this.resolve(limit)
      }
    })
  },

  max(max, msg){
    var limit = max;

    if (!Ref.isRef(limit)) {
      limit = this.cast(max)
      if (!this._typeCheck(limit))
        throw new TypeError('`max` must be a Date or a value that can be `cast()` to a Date')
    }

    return this.test({
      name: 'max',
      exclusive: true,
      message: msg || locale.max,
      params: { max },
      test(value) {
        return isAbsent(value) || value <= this.resolve(limit)
      }
    })
  }

})
