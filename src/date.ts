import MixedSchema from './mixed';
// @ts-ignore
import isoParse from './util/isodate';
import { date as locale, MixedLocale } from './locale';
import isAbsent from './util/isAbsent';
import Ref from './Reference';
import type { Maybe } from './types';
import type { Nullability, Presence, Unset } from './util/types';

let invalidDate = new Date('');

let isDate = (obj: any): obj is Date =>
  Object.prototype.toString.call(obj) === '[object Date]';

export function create() {
  return new DateSchema();
}

export default class DateSchema<
  TType extends Date,
  TDefault extends Maybe<TType> = undefined,
  TNullablity extends Nullability = Unset,
  TPresence extends Presence = Unset
> extends MixedSchema<TType, TDefault, TNullablity, TPresence> {
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

  protected _typeCheck(v: any): v is TType {
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
      test(value) {
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
      test(value) {
        return isAbsent(value) || value <= this.resolve<Date>(limit);
      },
    });
  }
}

export default interface DateSchema<
  TType extends Date,
  TDefault extends Maybe<TType>,
  TNullablity extends Nullability,
  TPresence extends Presence
> extends MixedSchema<TType, TDefault, TNullablity, TPresence> {
  default<TNextDefault extends Maybe<TType>>(
    def: TNextDefault | (() => TNextDefault),
  ): DateSchema<TType, TNextDefault, TNullablity, TPresence>;

  defined(
    msg?: MixedLocale['defined'],
  ): DateSchema<TType, TDefault, TNullablity, 'defined'>;

  required(
    msg?: MixedLocale['required'],
  ): DateSchema<TType, TDefault, TNullablity, 'required'>;
  notRequired(): DateSchema<TType, TDefault, TNullablity, 'optional'>;

  nullable(
    isNullable?: true,
  ): DateSchema<TType, TDefault, 'nullable', TPresence>;
  nullable(
    isNullable: false,
  ): DateSchema<TType, TDefault, 'nonnullable', TPresence>;
}
