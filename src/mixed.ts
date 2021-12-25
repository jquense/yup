import { AnyObject, Maybe, Message, Optionals } from './types';
import type { Defined, Flags, Thunk, ToggleDefault } from './util/types';
import BaseSchema from './schema';

export declare class MixedSchema<
  TType = any,
  TContext = AnyObject,
  TFlags extends Flags = '',
> extends BaseSchema<TType, TContext, TFlags> {
  default<D extends Maybe<TType>>(
    def: Thunk<D>,
  ): MixedSchema<TType, TContext, ToggleDefault<TFlags, D>>;

  concat<IT, IC, IF extends Flags>(
    schema: MixedSchema<IT, IC, IF>,
  ): MixedSchema<NonNullable<TType> | IT, TContext & IC, TFlags | IF>;
  concat<IT, IC, IF extends Flags>(
    schema: BaseSchema<IT, IC>,
  ): MixedSchema<
    NonNullable<TType> | Optionals<IT>,
    TContext & IC,
    TFlags | IF
  >;
  concat(schema: this): this;

  defined(msg?: Message): MixedSchema<Defined<TType>, TContext, TFlags>;
  optional(): MixedSchema<TType | undefined, TContext, TFlags>;

  required(msg?: Message): MixedSchema<NonNullable<TType>, TContext, TFlags>;
  notRequired(): MixedSchema<Maybe<TType>, TContext, TFlags>;

  nullable(msg?: Message): MixedSchema<TType | null, TContext, TFlags>;
  nonNullable(): MixedSchema<Exclude<TType, null>, TContext, TFlags>;
}

const Mixed: typeof MixedSchema = BaseSchema as any;

export default Mixed;

export function create<TType = any>() {
  return new Mixed<TType | undefined>();
}
// XXX: this is using the Base schema so that `addMethod(mixed)` works as a base class
create.prototype = Mixed.prototype;
