import type { AnyObject, Preserve } from '../types';

export type Defined<T> = T extends undefined ? never : T;

export type NotNull<T> = T extends null ? never : T;

export type TypedSchema = {
  __type: any;
  __outputType: any;
};

export type TypeOf<TSchema extends TypedSchema> = TSchema['__type'];

export type Asserts<TSchema extends TypedSchema> = TSchema['__outputType'];

export type Thunk<T> = T | (() => T);

export type If<T, Y, N> = Exclude<T, undefined> extends never ? Y : N;

/* this seems to force TS to show the full type instead of all the wrapped generics */
export type _<T> = T extends {} ? { [k in keyof T]: _<T[k]> } : T;

//
// Schema Config
//

export type Flags = 's' | 'd' | '';

export interface Config<C = AnyObject, F extends Flags = ''> {
  context: C;
  flags: F;
}
export interface AnyConfig extends Config<any, any> {}

export type MergeConfig<T extends AnyConfig, U extends AnyConfig> = Config<
  T['context'] & U['context'],
  T['flags'] | U['flags']
>;

export type SetFlag<C extends AnyConfig, F extends Flags> = C extends Config<
  infer Context,
  infer Old
>
  ? Config<Context, Exclude<Old, ''> | F>
  : never;

export type UnsetFlag<C extends AnyConfig, F extends Flags> = C extends Config<
  infer Context,
  infer Old
>
  ? Exclude<Old, F> extends never
    ? Config<Context, ''>
    : Config<Context, Exclude<Old, F>>
  : never;

export type ToggleDefault<C extends AnyConfig, D> = Preserve<
  D,
  undefined
> extends never
  ? SetFlag<C, 'd'>
  : UnsetFlag<C, 'd'>;

// type _s = ToggleDefault<Config<any, 'd'>, undefined>;

// type _f = MergeConfig<Config<AnyObject, 'd'>, Config<AnyObject, ''>>;
