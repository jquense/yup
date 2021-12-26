import { AnyObject, Maybe, Message, Optionals } from './types';
import type {
  Defined,
  Flags,
  SetFlag,
  Thunk,
  ToggleDefault,
} from './util/types';
import BaseSchema from './schema';

export declare class MixedSchema<
  TType = any,
  TContext = AnyObject,
  TDefault = undefined,
  TFlags extends Flags = '',
> extends BaseSchema<TType, TContext, TDefault, TFlags> {
  default<D extends Maybe<TType>>(
    def: Thunk<D>,
  ): MixedSchema<TType, TContext, TDefault, ToggleDefault<TFlags, D>>;

  concat<IT, IC, ID, IF extends Flags>(
    schema: MixedSchema<IT, IC, ID, IF>,
  ): MixedSchema<NonNullable<TType> | IT, TContext & IC, ID, TFlags | IF>;
  concat<IT, IC, ID, IF extends Flags>(
    schema: BaseSchema<IT, IC, ID, IF>,
  ): MixedSchema<
    NonNullable<TType> | Optionals<IT>,
    TContext & IC,
    ID,
    TFlags | IF
  >;
  concat(schema: this): this;

  defined(
    msg?: Message,
  ): MixedSchema<Defined<TType>, TContext, TDefault, TFlags>;
  optional(): MixedSchema<TType | undefined, TContext, TDefault, TFlags>;

  required(
    msg?: Message,
  ): MixedSchema<NonNullable<TType>, TContext, TDefault, TFlags>;
  notRequired(): MixedSchema<Maybe<TType>, TContext, TDefault, TFlags>;

  nullable(
    msg?: Message,
  ): MixedSchema<TType | null, TContext, TDefault, TFlags>;

  nonNullable(): MixedSchema<Exclude<TType, null>, TContext, TDefault, TFlags>;

  strip(): MixedSchema<TType, TContext, TDefault, SetFlag<TFlags, 's'>>;
}

const Mixed: typeof MixedSchema = BaseSchema as any;

export default Mixed;

export function create<TType = any>() {
  return new Mixed<TType | undefined>();
}
// XXX: this is using the Base schema so that `addMethod(mixed)` works as a base class
create.prototype = Mixed.prototype;
