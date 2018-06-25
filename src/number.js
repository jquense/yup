import inherits from './util/inherits';
import MixedSchema from './mixed';
import isAbsent from './util/isAbsent';

let isNaN = value => value != +value;

let isInteger = val => isAbsent(val) || val === (val | 0);

export default function NumberSchema() {
  if (!(this instanceof NumberSchema)) return new NumberSchema();

  MixedSchema.call(this, { type: 'number' });

  this.withMutation(() => {
    this.transform(function(value) {
      if (this.isType(value)) return value;

      let parsed = parseFloat(value);
      if (this.isType(parsed)) return parsed;

      return NaN;
    });
  });
}

inherits(NumberSchema, MixedSchema, {
  _typeCheck(value) {
    if (value instanceof Number) value = value.valueOf();

    return typeof value === 'number' && !isNaN(value);
  },

  min(min, message = null, localePath = null) {
    return this.test({
      message,
      localePath: localePath || 'number.min',
      name: 'min',
      exclusive: true,
      params: { min },
      test(value) {
        return isAbsent(value) || value >= this.resolve(min);
      },
    });
  },

  max(max, message = null, localePath = null) {
    return this.test({
      message,
      localePath: localePath || 'number.max',
      name: 'max',
      exclusive: true,
      params: { max },
      test(value) {
        return isAbsent(value) || value <= this.resolve(max);
      },
    });
  },

  lessThan(less, message = null) {
    return this.test({
      message,
      localePath: 'number.less',
      name: 'max',
      exclusive: true,
      params: { less },
      test(value) {
        return isAbsent(value) || value < this.resolve(less);
      },
    });
  },

  moreThan(more, message = null) {
    return this.test({
      message,
      localePath: 'number.more',
      name: 'min',
      exclusive: true,
      params: { more },
      test(value) {
        return isAbsent(value) || value > this.resolve(more);
      },
    });
  },

  positive(msg = null) {
    return this.min(0, msg, 'number.positive');
  },

  negative(msg = null) {
    return this.max(0, msg, 'number.negative');
  },

  integer(message = null) {
    return this.test({
      name: 'integer',
      message,
      localePath: 'number.integer',
      test: isInteger,
    });
  },

  truncate() {
    return this.transform(value => (!isAbsent(value) ? value | 0 : value));
  },

  round(method) {
    var avail = ['ceil', 'floor', 'round', 'trunc'];
    method = (method && method.toLowerCase()) || 'round';

    // this exists for symemtry with the new Math.trunc
    if (method === 'trunc') return this.truncate();

    if (avail.indexOf(method.toLowerCase()) === -1)
      throw new TypeError(
        'Only valid options for round() are: ' + avail.join(', '),
      );

    return this.transform(
      value => (!isAbsent(value) ? Math[method](value) : value),
    );
  },
});
