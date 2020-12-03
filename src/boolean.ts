import BaseSchema from './schema';
import type { MixedLocale } from './locale';
import type { AnyObject, Maybe, Optionals } from './types';
import type { Defined } from './util/types';
import { boolean as locale } from './locale';
import isAbsent from './util/isAbsent';

export function create() {
  return new BooleanSchema();
}

export default class BooleanSchema<
  TType extends Maybe<boolean> = boolean | undefined,
  TContext extends AnyObject = AnyObject,
  TOut extends TType = TType
> extends BaseSchema<TType, TContext, TOut> {
  constructor() {
    super({ type: 'boolean' });

    this.withMutation(() => {
      this.transform(function (value) {
        if (!this.isType(value)) {
          if (/^(true|1)$/i.test(String(value))) return true;
          if (/^(false|0)$/i.test(String(value))) return false;
        }
        return value;
      });
    });
  }

  protected _typeCheck(v: any): v is NonNullable<TType> {
    if (v instanceof Boolean) v = v.valueOf();

    return typeof v === 'boolean';
  }

  isTrue(
    message = locale.isValue,
  ): BooleanSchema<TType | true, TContext, true | Optionals<TOut>> {
    return this.test({
      message,
      name: 'is-value',
      exclusive: true,
      params: { value: 'true' },
      test(value) {
        return isAbsent(value) || value === true;
      },
    }) as any;
  }

  isFalse(
    message = locale.isValue,
  ): BooleanSchema<TType | false, TContext, false | Optionals<TOut>> {
    return this.test({
      message,
      name: 'is-value',
      exclusive: true,
      params: { value: 'false' },
      test(value) {
        return isAbsent(value) || value === false;
      },
    }) as any;
  }
}

create.prototype = BooleanSchema.prototype;

export default interface BooleanSchema<
  TType extends Maybe<boolean>,
  TContext extends AnyObject = AnyObject,
  TOut extends TType = TType
> extends BaseSchema<TType, TContext, TOut> {
  concat<TOther extends BooleanSchema<any, any, any>>(schema: TOther): TOther;

  default<TNextDefault extends Maybe<TType>>(
    def: TNextDefault | (() => TNextDefault),
  ): TNextDefault extends undefined
    ? BooleanSchema<TType | undefined, TContext>
    : BooleanSchema<Defined<TType>, TContext>;

  defined(msg?: MixedLocale['defined']): DefinedBooleanSchema<TType, TContext>;
  required(
    msg?: MixedLocale['required'],
  ): RequiredBooleanSchema<TType, TContext>;
  optional(): BooleanSchema<TType, TContext>;
  notRequired(): BooleanSchema<TType, TContext>;

  nullable(isNullable?: true): BooleanSchema<TType | null>;
  nullable(isNullable: false): BooleanSchema<Exclude<TType, null>>;
}

export interface DefinedBooleanSchema<
  TType extends Maybe<boolean>,
  TContext extends AnyObject = AnyObject
> extends BooleanSchema<TType, TContext, Defined<TType>> {
  default<TNextDefault extends Maybe<TType>>(
    def: TNextDefault | (() => TNextDefault),
  ): TNextDefault extends undefined
    ? BooleanSchema<TType | undefined, TContext>
    : BooleanSchema<Defined<TType>, TContext>;

  defined(msg?: MixedLocale['defined']): DefinedBooleanSchema<TType, TContext>;
  required(
    msg?: MixedLocale['required'],
  ): RequiredBooleanSchema<TType, TContext>;
  optional(): BooleanSchema<TType, TContext>;
  notRequired(): BooleanSchema<TType, TContext>;

  nullable(isNullable?: true): DefinedBooleanSchema<TType | null>;
  nullable(isNullable: false): DefinedBooleanSchema<Exclude<TType, null>>;
}

export interface RequiredBooleanSchema<
  TType extends Maybe<boolean>,
  TContext extends AnyObject = AnyObject
> extends BooleanSchema<TType, TContext, NonNullable<TType>> {
  default<TNextDefault extends Maybe<TType>>(
    def: TNextDefault | (() => TNextDefault),
  ): TNextDefault extends undefined
    ? BooleanSchema<TType | undefined, TContext>
    : BooleanSchema<Defined<TType>, TContext>;

  defined(msg?: MixedLocale['defined']): DefinedBooleanSchema<TType, TContext>;
  required(
    msg?: MixedLocale['required'],
  ): RequiredBooleanSchema<TType, TContext>;
  optional(): BooleanSchema<TType, TContext>;
  notRequired(): BooleanSchema<TType, TContext>;

  nullable(isNullable?: true): RequiredBooleanSchema<TType | null, TContext>;
  nullable(
    isNullable: false,
  ): RequiredBooleanSchema<Exclude<TType, null>, TContext>;
}
