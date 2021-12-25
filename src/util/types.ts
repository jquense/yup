import type { ResolveOptions } from '../Condition';
import type { CastOptions, SchemaFieldDescription } from '../schema';
import type { AnyObject, Callback, Preserve, ValidateOptions } from '../types';

export type Defined<T> = T extends undefined ? never : T;

export type NotNull<T> = T extends null ? never : T;

export interface ISchema<T, C = AnyObject, F extends Flags = any> {
  __flags: F;
  __context: C;
  __outputType: T;

  cast(value: any, options: CastOptions<C>): T;
  validate(
    value: any,
    options?: ValidateOptions<C>,
    maybeCb?: Callback,
  ): Promise<T>;

  describe(options?: ResolveOptions<C>): SchemaFieldDescription;
}

export type Asserts<TSchema extends ISchema<any>> = TSchema['__outputType'];

export type Thunk<T> = T | (() => T);

export type If<T, Y, N> = Exclude<T, undefined> extends never ? Y : N;

/* this seems to force TS to show the full type instead of all the wrapped generics */
export type _<T> = T extends {} ? { [k in keyof T]: T[k] } : T;

type OptionalKeys<T extends {}> = {
  [k in keyof T]: undefined extends T[k] ? k : never;
}[keyof T];

type RequiredKeys<T extends object> = Exclude<keyof T, OptionalKeys<T>>;

export type MakePartial<T extends object> = {
  [k in OptionalKeys<T>]?: T[k];
} & { [k in RequiredKeys<T>]: T[k] };

//
// Schema Config
//

export type Flags = 's' | 'd' | '';

export type SetFlag<Old extends Flags, F extends Flags> = Exclude<Old, ''> | F;

export type UnsetFlag<Old extends Flags, F extends Flags> = Exclude<
  Old,
  F
> extends never
  ? ''
  : Exclude<Old, F>;

export type ToggleDefault<F extends Flags, D> = Preserve<
  D,
  undefined
> extends never
  ? SetFlag<F, 'd'>
  : UnsetFlag<F, 'd'>;
