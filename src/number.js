import inherits from './util/inherits';
import MixedSchema from './mixed';
import { number as locale } from './locale';
import isAbsent from './util/isAbsent';

let isNaN = value => value != +value;

export default function NumberSchema() {
  if (!(this instanceof NumberSchema)) return new NumberSchema();

  MixedSchema.call(this, { type: 'number' });

  this.withMutation(() => {
    this.transform(function(value) {
      let parsed = value;

      if (typeof parsed === 'string') {
        parsed = parsed.replace(/\s/g, '');
        if (parsed === '') return NaN;
        // don't use parseFloat to avoid positives on alpha-numeric strings
        parsed = +parsed;
      }

      if (this.isType(parsed)) return parsed;

      return parseFloat(parsed);
    });
  });
}

inherits(NumberSchema, MixedSchema, {
  _typeCheck(value) {
    if (value instanceof Number) value = value.valueOf();

    return typeof value === 'number' && !isNaN(value);
  },

  min(min, message = locale.min) {
    return this.test({
      message,
      name: 'min',
      exclusive: true,
      params: { min },
      test(value) {
        return isAbsent(value) || value >= this.resolve(min);
      },
    });
  },

  max(max, message = locale.max) {
    return this.test({
      message,
      name: 'max',
      exclusive: true,
      params: { max },
      test(value) {
        return isAbsent(value) || value <= this.resolve(max);
      },
    });
  },

  lessThan(less, message = locale.lessThan, overrides) {
    overrides = overrides || {};
    return this.test({
      message,
      name: overrides.name || 'lessThan',
      exclusive: true,
      params: { less },
      test(value) {
        return isAbsent(value) || value < this.resolve(less);
      },
    });
  },

  moreThan(more, message = locale.moreThan, overrides) {
    overrides = overrides || {};
    return this.test({
      message,
      name: overrides.name || 'moreThan',
      exclusive: true,
      params: { more },
      test(value) {
        return isAbsent(value) || value > this.resolve(more);
      },
    });
  },

  positive(msg = locale.positive) {
    return this.moreThan(0, msg, { name: 'positive' });
  },

  negative(msg = locale.negative) {
    return this.lessThan(0, msg, { name: 'negative' });
  },

  integer(message = locale.integer) {
    return this.test({
      name: 'integer',
      message,
      test: val => isAbsent(val) || Number.isInteger(val),
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

    return this.transform(value =>
      !isAbsent(value) ? Math[method](value) : value,
    );
  },
});
