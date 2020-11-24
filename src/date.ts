import MixedSchema from './mixed';
// @ts-ignore
import isoParse from './util/isodate';
import { date as locale, MixedLocale } from './locale';
import isAbsent from './util/isAbsent';
import Ref from './Reference';
import type { Maybe } from './types';
import type { Defined, Nullability, Presence, Unset } from './util/types';
import BaseSchema from './Base';

let invalidDate = new Date('');

let isDate = (obj: any): obj is Date =>
  Object.prototype.toString.call(obj) === '[object Date]';

export function create() {
  return new DateSchema();
}

export default class DateSchema<
  TType extends Maybe<Date> = Date | undefined,
  TPresence extends Presence = Unset
> extends BaseSchema<TType, TType, TPresence> {
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

  protected _typeCheck(v: any): v is NonNullable<TType> {
    return isDate(v) && !isNaN(v.getTime());
  }

  private prepareParam(
    ref: unknown | Ref<Date>,
    name: string,
  ): Date | Ref<Date> {
    let param: Date | Ref<Date>;

    if (!Ref.isRef(ref)) {
      let cast = this.cast(ref);
      if (!this._typeCheck(cast))
        throw new TypeError(
          `\`${name}\` must be a Date or a value that can be \`cast()\` to a Date`,
        );
      param = cast;
    } else {
      param = ref as Ref<Date>;
    }
    return param;
  }

  min(min: unknown | Ref<Date>, message = locale.min) {
    let limit = this.prepareParam(min, 'min');

    return this.test({
      message,
      name: 'min',
      exclusive: true,
      params: { min },
      test(value) {
        return isAbsent(value) || value >= this.resolve(limit);
      },
    });
  }

  max(max: unknown | Ref, message = locale.max) {
    var limit = this.prepareParam(max, 'max');

    return this.test({
      message,
      name: 'max',
      exclusive: true,
      params: { max },
      test(value) {
        return isAbsent(value) || value <= this.resolve(limit);
      },
    });
  }
}

export default interface DateSchema<
  TType extends Maybe<Date>,
  TPresence extends Presence
> extends BaseSchema<TType, TType, TPresence> {
  default<TNextDefault extends Maybe<TType>>(
    def: TNextDefault | (() => TNextDefault),
  ): TNextDefault extends undefined
    ? DateSchema<TType | undefined, TPresence>
    : DateSchema<Defined<TType>, TPresence>;

  defined(msg?: MixedLocale['defined']): DateSchema<TType, 'defined'>;

  required(msg?: MixedLocale['required']): DateSchema<TType, 'required'>;
  notRequired(): DateSchema<TType, 'optional'>;

  nullable(isNullable?: true): DateSchema<TType, TPresence>;
  nullable(isNullable: false): DateSchema<TType, TPresence>;
}
