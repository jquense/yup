import MixedSchema from './mixed';
import inherits from './util/inherits';
import isoParse from './util/isodate';
import { date as locale } from './locale';
import isAbsent from './util/isAbsent';
import Ref from './Reference';

let invalidDate = new Date('');

let isDate = obj => Object.prototype.toString.call(obj) === '[object Date]';

export default DateSchema;

function DateSchema() {
  if (!(this instanceof DateSchema)) return new DateSchema();

  MixedSchema.call(this, { type: 'date' });

  this.withMutation(() => {
    this.transform(function(value) {
      if (this.isType(value)) return value;

      value = isoParse(value);
      // 0 is a valid timestamp equivalent to 1970-01-01T00:00:00Z(unix epoch)
      return value > -1 ? new Date(value) : invalidDate;
    });
  });
}

inherits(DateSchema, MixedSchema, {
  _typeCheck(v) {
    return isDate(v) && !isNaN(v.getTime());
  },

  min(min, message = locale.min) {
    var limit = min;

    if (!Ref.isRef(limit)) {
      limit = this.cast(min);
      if (!this._typeCheck(limit))
        throw new TypeError(
          '`min` must be a Date or a value that can be `cast()` to a Date',
        );
    }

    return this.test({
      message,
      name: 'min',
      exclusive: true,
      params: { min },
      test(value) {
        return isAbsent(value) || value >= this.resolve(limit);
      },
    });
  },

  max(max, message = locale.max) {
    var limit = max;

    if (!Ref.isRef(limit)) {
      limit = this.cast(max);
      if (!this._typeCheck(limit))
        throw new TypeError(
          '`max` must be a Date or a value that can be `cast()` to a Date',
        );
    }

    return this.test({
      message,
      name: 'max',
      exclusive: true,
      params: { max },
      test(value) {
        return isAbsent(value) || value <= this.resolve(limit);
      },
    });
  },
});
