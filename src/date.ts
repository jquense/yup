import MixedSchema from './mixed';
// @ts-ignore
import isoParse from './util/isodate';
import { date as locale, MixedLocale } from './locale';
import isAbsent from './util/isAbsent';
import Ref from './Reference';
import type { AnyObject, Maybe } from './types';
import type { Defined, If, Thunk } from './util/types';
import BaseSchema from './Base';

let invalidDate = new Date('');

let isDate = (obj: any): obj is Date =>
  Object.prototype.toString.call(obj) === '[object Date]';

export function create() {
  return new DateSchema();
}

export default class DateSchema<
  TType extends Maybe<Date> = Date | undefined,
  TContext extends AnyObject = AnyObject,
  TOut extends TType = TType
> extends BaseSchema<TType, TContext, TOut> {
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
  TContext extends AnyObject = AnyObject,
  TOut extends TType = TType
> extends BaseSchema<TType, TContext, TOut> {
  concat<TOther extends DateSchema<any, any, any>>(schema: TOther): TOther;

  default<D extends Maybe<TType>>(
    def: Thunk<D>,
  ): If<
    D,
    DateSchema<TType | undefined, TContext>,
    DateSchema<Defined<TType>, TContext>
  >;

  defined(msg?: MixedLocale['defined']): DefinedDateSchema<TType, TContext>;

  required(msg?: MixedLocale['required']): RequiredDateSchema<TType, TContext>;
  optional(): DateSchema<TType, TContext>;
  notRequired(): DateSchema<TType, TContext>;

  nullable(isNullable?: true): DateSchema<TType | null, TContext>;
  nullable(isNullable: false): DateSchema<Exclude<TType, null>, TContext>;
}

export interface DefinedDateSchema<
  TType extends Maybe<Date>,
  TContext extends AnyObject = AnyObject
> extends DateSchema<TType, TContext, Defined<TType>> {
  default<D extends Maybe<TType>>(
    def: Thunk<D>,
  ): If<
    D,
    DefinedDateSchema<TType | undefined, TContext>,
    DefinedDateSchema<Defined<TType>, TContext>
  >;

  defined(msg?: MixedLocale['defined']): this;
  required(msg?: MixedLocale['required']): RequiredDateSchema<TType, TContext>;
  optional(): DateSchema<TType, TContext>;
  notRequired(): DateSchema<TType, TContext>;
  nullable(isNullable?: true): RequiredDateSchema<TType | null, TContext>;
  nullable(
    isNullable: false,
  ): RequiredDateSchema<Exclude<TType, null>, TContext>;
}

export interface RequiredDateSchema<
  TType extends Maybe<Date>,
  TContext extends AnyObject = AnyObject
> extends DateSchema<TType, TContext, NonNullable<TType>> {
  default<D extends Maybe<TType>>(
    def: Thunk<D>,
  ): If<
    D,
    RequiredDateSchema<TType | undefined, TContext>,
    RequiredDateSchema<Defined<TType>, TContext>
  >;

  defined(msg?: MixedLocale['defined']): DefinedDateSchema<TType, TContext>;
  required(msg?: MixedLocale['required']): RequiredDateSchema<TType, TContext>;
  optional(): DateSchema<TType, TContext>;
  notRequired(): DateSchema<TType, TContext>;
  nullable(isNullable?: true): RequiredDateSchema<TType | null, TContext>;
  nullable(
    isNullable: false,
  ): RequiredDateSchema<Exclude<TType, null>, TContext>;
}
