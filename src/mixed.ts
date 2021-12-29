import { AnyObject, Maybe, Message } from './types';
import type {
  Concat,
  Defined,
  Flags,
  SetFlag,
  Thunk,
  ToggleDefault,
  UnsetFlag,
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
  ): MixedSchema<TType, TContext, D, ToggleDefault<TFlags, D>>;

  concat<IT, IC, ID, IF extends Flags>(
    schema: MixedSchema<IT, IC, ID, IF>,
  ): MixedSchema<Concat<TType, IT>, TContext & IC, ID, TFlags | IF>;
  concat<IT, IC, ID, IF extends Flags>(
    schema: BaseSchema<IT, IC, ID, IF>,
  ): MixedSchema<Concat<TType, IT>, TContext & IC, ID, TFlags | IF>;
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

  strip(
    enabled: false,
  ): MixedSchema<TType, TContext, TDefault, UnsetFlag<TFlags, 's'>>;
  strip(
    enabled?: true,
  ): MixedSchema<TType, TContext, TDefault, SetFlag<TFlags, 's'>>;
}

const Mixed: typeof MixedSchema = BaseSchema as any;

export default Mixed;

export type TypeGuard<TType> = (value: any) => value is NonNullable<TType>;
export interface MixedOptions<TType> {
  type?: string;
  check?: TypeGuard<TType>;
}
export function create<TType = any>(
  spec?: MixedOptions<TType> | TypeGuard<TType>,
) {
  return new Mixed<TType | undefined>(
    typeof spec === 'function' ? { check: spec } : spec,
  );
}
// XXX: this is using the Base schema so that `addMethod(mixed)` works as a base class
create.prototype = Mixed.prototype;
