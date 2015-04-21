'use strict';
var MixedSchema = require('./mixed')
  , isoParse = require('./util/isodate')
  , locale = require('./locale.js').date
  , { isDate, inherits } = require('./util/_');

let invalidDate = new Date('')

module.exports = DateSchema

function DateSchema(){
  if ( !(this instanceof DateSchema)) return new DateSchema()

  MixedSchema.call(this, { type: 'date'})

  this.transforms.push(function(value) {

    if (this.isType(value))
      return isDate(value) ? new Date(value) : value

    value = isoParse(value)
    return value ? new Date(value) : invalidDate
  })
}

inherits(DateSchema, MixedSchema, {

  _typeCheck(v) {
    return isDate(v) && !isNaN(v.getTime())
  },

  min(min, msg){
    var limit = this.cast(min);
    msg = msg || locale.min

    if(!this._typeCheck(limit))
      throw new TypeError('`min` must be a Date or a value that can be parsed to a Date')

    return this.test({ 
      name: 'min', 
      exclusive: true, 
      message: msg, 
      params: { min: min },
      test: value => value && (value >= limit)
    })
  },

  max(max, msg){
    var limit = this.cast(max);

    if(!this._typeCheck(limit))
      throw new TypeError('`max` must be a Date or a value that can be parsed to a Date')

    return this.test({ 
      name: 'max',
      exclusive: true, 
      message: msg || locale.max, 
      params: { max: max },
      test: value => !value || (value <= limit)
    })
  }

})