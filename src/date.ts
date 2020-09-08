import MixedSchema from './mixed';
// @ts-ignore
import isoParse from './util/isodate';
import { date as locale } from './locale';
import isAbsent from './util/isAbsent';
import Ref from './Reference';

let invalidDate = new Date('');

let isDate = (obj: any): obj is Date =>
  Object.prototype.toString.call(obj) === '[object Date]';

export function create() {
  return new DateSchema();
}

export default class DateSchema extends MixedSchema<Date> {
  constructor() {
    super({ type: 'date' });

    this.withMutation(() => {
      this.transform(function (value) {
        if (this.isType(value)) return value;

        value = isoParse(value);

        // 0 is a valid timestamp equivalent to 1970-01-01T00:00:00Z(unix epoch) or before.
        return !isNaN(value) ? new Date(value) : invalidDate;
      });
    });
  }

  protected _typeCheck(v: any): v is Date {
    return isDate(v) && !isNaN(v.getTime());
  }

  min(min: unknown | Ref, message = locale.min) {
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
      test(value: Date) {
        return isAbsent(value) || value >= this.resolve<Date>(limit);
      },
    });
  }

  max(max: unknown | Ref, message = locale.max) {
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
      test(value: Date) {
        return isAbsent(value) || value <= this.resolve<Date>(limit);
      },
    });
  }
}
