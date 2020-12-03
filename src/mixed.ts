import type { MixedLocale } from './locale';

import { AnyObject, Maybe, Optionals } from './types';
import type { Defined } from './util/types';
import BaseSchema from './schema';

export function create<TType = any>() {
  return new MixedSchema<TType | undefined>();
}

export default class MixedSchema<
  TType = any,
  TContext = AnyObject,
  TOut = TType
> extends BaseSchema<TType, TContext, TOut> {}

create.prototype = MixedSchema.prototype;

export default interface MixedSchema<
  TType = any,
  TContext = AnyObject,
  TOut = TType
> {
  default<TNextDefault extends Maybe<TType>>(
    def: TNextDefault | (() => TNextDefault),
  ): TNextDefault extends undefined
    ? MixedSchema<TType | undefined, TContext>
    : MixedSchema<Defined<TType>, TContext>;

  concat(schema: this): this;
  concat<IT, IC, IO>(
    schema: BaseSchema<IT, IC, IO>,
  ): MixedSchema<
    TType | IT,
    TContext & IC,
    NonNullable<TOut> | IO | Optionals<IO>
  >;
  defined(
    msg?: MixedLocale['defined'],
  ): MixedSchema<TType, TContext, Defined<TOut>>;
  required(
    msg?: MixedLocale['required'],
  ): MixedSchema<TType, TContext, NonNullable<TOut>>;
  notRequired(): MixedSchema<TType, TContext>;

  nullable(isNullable?: true): MixedSchema<TType | null, TContext>;
  nullable(isNullable: false): MixedSchema<Exclude<TType, null>, TContext>;
}
