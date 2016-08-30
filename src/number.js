import inherits from './util/inherits';
import MixedSchema from './mixed';
import { number as locale} from './locale.js';
import isAbsent from './util/isAbsent';


let isNaN = value => value != +value

let isInteger = val => isAbsent(val) || val === (val | 0)

export default function NumberSchema() {
  if ( !(this instanceof NumberSchema))
    return new NumberSchema()

  MixedSchema.call(this, { type: 'number' })

  this.withMutation(() => {
    this.transform(function(value) {
      if (this.isType(value)) return value

      let parsed = parseFloat(value);
      if (this.isType(parsed)) return parsed

      return NaN;
    })
  })
}

inherits(NumberSchema, MixedSchema, {

  _typeCheck(value) {
    if (value instanceof Number)
      value = value.valueOf();

    return typeof value === 'number' && !isNaN(value)
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

  less(less, msg) {
    return this.test({
      name: 'min',
      exclusive: true,
      params: { less },
      message: msg || locale.less,
      test(value) {
        return isAbsent(value) || value < this.resolve(less)
      }
    })
  },


  more(more, msg) {
    return this.test({
      name: 'min',
      exclusive: true,
      params: { more },
      message: msg || locale.more,
      test(value) {
        return isAbsent(value) || value > this.resolve(more)
      }
    })
  },

  notEqual(notEqual, msg) {
    return this.test({
      name: 'min',
      exclusive: true,
      params: { notEqual },
      message: msg || locale.notEqual,
      test(value) {
        return isAbsent(value) || value !== this.resolve(notEqual)
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
    msg = msg || locale.integer;

    return this.test('integer', msg, isInteger)
  },

  truncate() {
    return this.transform(value =>
      !isAbsent(value) ? (value | 0) : value)
  },

  round(method) {
    var avail = ['ceil', 'floor', 'round', 'trunc']
    method = (method && method.toLowerCase()) || 'round'

    // this exists for symemtry with the new Math.trunc
    if (method === 'trunc')
      return this.truncate()

    if (avail.indexOf(method.toLowerCase()) === -1)
      throw new TypeError('Only valid options for round() are: ' + avail.join(', '))

    return this.transform(value => !isAbsent(value) ? Math[method](value) : value)
  }
})
