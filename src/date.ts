// @ts-ignore
import isoParse from './util/isodate';
import { date as locale } from './locale';
import isAbsent from './util/isAbsent';
import Ref from './Reference';
import type { AnyObject, Maybe, Message } from './types';
import type {
  Defined,
  Flags,
  NotNull,
  SetFlag,
  Thunk,
  ToggleDefault,
  UnsetFlag,
} from './util/types';
import Schema from './schema';

let invalidDate = new Date('');

let isDate = (obj: any): obj is Date =>
  Object.prototype.toString.call(obj) === '[object Date]';

export function create(): DateSchema;
export function create<T extends Date, TContext = AnyObject>(): DateSchema<
  T | undefined,
  TContext
>;
export function create() {
  return new DateSchema();
}

export default class DateSchema<
  TType extends Maybe<Date> = Date | undefined,
  TContext = AnyObject,
  TDefault = undefined,
  TFlags extends Flags = '',
> extends Schema<TType, TContext, TDefault, TFlags> {
  static INVALID_DATE = invalidDate;

  constructor() {
    super({
      type: 'date',
      check(v: any): v is NonNullable<TType> {
        return isDate(v) && !isNaN(v.getTime());
      },
    });

    this.withMutation(() => {
      this.transform(function (value) {
        if (this.isType(value)) return value;

        value = isoParse(value);

        // 0 is a valid timestamp equivalent to 1970-01-01T00:00:00Z(unix epoch) or before.
        return !isNaN(value) ? new Date(value) : DateSchema.INVALID_DATE;
      });
    });
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
    let limit = this.prepareParam(max, 'max');

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

create.prototype = DateSchema.prototype;
create.INVALID_DATE = invalidDate;

export default interface DateSchema<
  TType extends Maybe<Date>,
  TContext = AnyObject,
  TDefault = undefined,
  TFlags extends Flags = '',
> extends Schema<TType, TContext, TDefault, TFlags> {
  default<D extends Maybe<TType>>(
    def: Thunk<D>,
  ): DateSchema<TType, TContext, D, ToggleDefault<TFlags, D>>;

  concat<TOther extends DateSchema<any, any>>(schema: TOther): TOther;

  defined(
    msg?: Message,
  ): DateSchema<Defined<TType>, TContext, TDefault, TFlags>;
  optional(): DateSchema<TType | undefined, TContext, TDefault, TFlags>;

  required(
    msg?: Message,
  ): DateSchema<NonNullable<TType>, TContext, TDefault, TFlags>;
  notRequired(): DateSchema<Maybe<TType>, TContext, TDefault, TFlags>;

  nullable(msg?: Message): DateSchema<TType | null, TContext, TDefault, TFlags>;
  nonNullable(): DateSchema<NotNull<TType>, TContext, TDefault, TFlags>;

  strip(
    enabled: false,
  ): DateSchema<TType, TContext, TDefault, UnsetFlag<TFlags, 's'>>;
  strip(
    enabled?: true,
  ): DateSchema<TType, TContext, TDefault, SetFlag<TFlags, 's'>>;
}
