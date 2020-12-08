import type { MixedLocale } from './locale';

import { AnyObject, Maybe, Optionals } from './types';
import type { Defined } from './util/types';
import BaseSchema from './schema';

declare class MixedSchema<
  TType = any,
  TContext = AnyObject,
  TOut = TType
> extends BaseSchema<TType, TContext, TOut> {
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

const Mixed: typeof MixedSchema = BaseSchema as any;

export default Mixed;

export function create<TType = any>() {
  return new Mixed<TType | undefined>();
}
// XXX: this is using the Base schema so that `addMethod(mixed)` works as a base class
create.prototype = Mixed.prototype;
