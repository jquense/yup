import { AnyObject, DefaultThunk, Message } from './types';
import type {
  Concat,
  Defined,
  Flags,
  SetFlag,
  Maybe,
  ToggleDefault,
  UnsetFlag,
} from './util/types';
import Schema from './schema';

const returnsTrue: any = () => true;

type AnyPresentValue = {};

export type TypeGuard<TType> = (value: any) => value is NonNullable<TType>;
export interface MixedOptions<TType> {
  type?: string;
  check?: TypeGuard<TType>;
}

export function create<TType extends AnyPresentValue>(
  spec?: MixedOptions<TType> | TypeGuard<TType>,
) {
  return new MixedSchema<TType | undefined>(spec);
}

export default class MixedSchema<
  TType extends Maybe<AnyPresentValue> = AnyPresentValue | undefined,
  TContext = AnyObject,
  TDefault = undefined,
  TFlags extends Flags = '',
> extends Schema<TType, TContext, TDefault, TFlags> {
  constructor(spec?: MixedOptions<TType> | TypeGuard<TType>) {
    super(
      typeof spec === 'function'
        ? { type: 'mixed', check: spec }
        : { type: 'mixed', check: returnsTrue as TypeGuard<TType>, ...spec },
    );
  }
}

export default interface MixedSchema<
  TType extends Maybe<AnyPresentValue> = AnyPresentValue | undefined,
  TContext = AnyObject,
  TDefault = undefined,
  TFlags extends Flags = '',
> extends Schema<TType, TContext, TDefault, TFlags> {
  default<D extends Maybe<TType>>(
    def: DefaultThunk<D, TContext>,
  ): MixedSchema<TType, TContext, D, ToggleDefault<TFlags, D>>;

  concat<IT, IC, ID, IF extends Flags>(
    schema: MixedSchema<IT, IC, ID, IF>,
  ): MixedSchema<Concat<TType, IT>, TContext & IC, ID, TFlags | IF>;
  concat<IT, IC, ID, IF extends Flags>(
    schema: Schema<IT, IC, ID, IF>,
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

  nonNullable(
    msg?: Message,
  ): MixedSchema<Exclude<TType, null>, TContext, TDefault, TFlags>;

  strip(
    enabled: false,
  ): MixedSchema<TType, TContext, TDefault, UnsetFlag<TFlags, 's'>>;
  strip(
    enabled?: true,
  ): MixedSchema<TType, TContext, TDefault, SetFlag<TFlags, 's'>>;
}

create.prototype = MixedSchema.prototype;
