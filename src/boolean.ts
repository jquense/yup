import BaseSchema from './Base';
import type { MixedLocale } from './locale';
import type { AnyObject, Maybe } from './types';
import type { Defined, StrictNonNullable } from './util/types';

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
}

export default interface BooleanSchema<
  TType extends Maybe<boolean>,
  TContext extends AnyObject = AnyObject,
  TOut extends TType = TType
> extends BaseSchema<TType, TContext, TOut> {
  default<TNextDefault extends Maybe<TType>>(
    def: TNextDefault | (() => TNextDefault),
  ): TNextDefault extends undefined
    ? BooleanSchema<TType | undefined>
    : BooleanSchema<Defined<TType>>;

  defined(msg?: MixedLocale['defined']): BooleanSchema<TType>;
  required(msg?: MixedLocale['required']): BooleanSchema<TType>;
  notRequired(): BooleanSchema<TType, TContext>;
  // optional(): BooleanSchema<TType, TContext>;

  nullable(isNullable?: true): BooleanSchema<TType | null>;
  nullable(isNullable: false): BooleanSchema<StrictNonNullable<TType>>;
}

interface DefinedBooleanSchema<
  TType extends Maybe<boolean>,
  TContext extends AnyObject = AnyObject
> extends BooleanSchema<TType, TContext, Defined<TType>> {
  default<TNextDefault extends Maybe<TType>>(
    def: TNextDefault | (() => TNextDefault),
  ): TNextDefault extends undefined
    ? BooleanSchema<TType | undefined>
    : BooleanSchema<Defined<TType>>;

  defined(msg?: MixedLocale['defined']): this;
  required(msg?: MixedLocale['required']): RequiredBooleanSchema<TType>;
  notRequired(): BooleanSchema<TType>;
  // optional(): BooleanSchema<TType>;

  nullable(isNullable?: true): DefinedBooleanSchema<TType | null>;
  nullable(isNullable: false): DefinedBooleanSchema<StrictNonNullable<TType>>;
}

interface RequiredBooleanSchema<
  TType extends Maybe<boolean>,
  TContext extends AnyObject = AnyObject
> extends BooleanSchema<TType, TContext, NonNullable<TType>> {
  default<TNextDefault extends Maybe<TType>>(
    def: TNextDefault | (() => TNextDefault),
  ): TNextDefault extends undefined
    ? BooleanSchema<TType | undefined, TContext>
    : BooleanSchema<Defined<TType>, TContext>;

  defined(msg?: MixedLocale['defined']): DefinedBooleanSchema<TType, TContext>;
  required(msg?: MixedLocale['required']): this;
  notRequired(): BooleanSchema<TType, TContext>;
  // optional(): BooleanSchema<TType, 'optional'>;

  nullable(isNullable?: true): RequiredBooleanSchema<TType | null, TContext>;
  nullable(
    isNullable: false,
  ): RequiredBooleanSchema<StrictNonNullable<TType>, TContext>;
}
