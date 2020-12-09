import { AnyObject, Maybe, Message, Optionals } from './types';
import type { Config, Defined, Thunk, ToggleDefault } from './util/types';
import BaseSchema from './schema';

export function create<TType = any, TContext = AnyObject>() {
  return new MixedSchema<TType | undefined, Config<TContext>>();
}

export default class MixedSchema<
  TType = any,
  TConfig extends Config<any, any> = Config
> extends BaseSchema<TType, TType, TConfig> {}

create.prototype = MixedSchema.prototype;

export default interface MixedSchema<
  TType = any,
  TConfig extends Config<any, any> = Config
> {
  default<D extends Maybe<TType>>(
    def: Thunk<D>,
  ): MixedSchema<TType, ToggleDefault<TConfig, D>>;

  concat<IT, IC extends Config<any, any>>(
    schema: MixedSchema<IT, IC>,
  ): MixedSchema<NonNullable<TType> | IT, TConfig & IC>;
  concat<IT, IC extends Config<any, any>>(
    schema: BaseSchema<IT, any, IC>,
  ): MixedSchema<NonNullable<TType> | Optionals<IT>, TConfig & IC>;
  concat(schema: this): this;

  defined(msg?: Message): MixedSchema<Defined<TType>, TConfig>;
  optional(): MixedSchema<TType | undefined, TConfig>;

  required(msg?: Message): MixedSchema<NonNullable<TType>, TConfig>;
  notRequired(): MixedSchema<Maybe<TType>, TConfig>;

  nullable(msg?: Message): MixedSchema<TType | null, TConfig>;
  nonNullable(): MixedSchema<Exclude<TType, null>, TConfig>;
}
