import type { ResolveOptions } from '../Condition';
import type { CastOptions, SchemaFieldDescription } from '../schema';
import type {
  AnyObject,
  Callback,
  Optionals,
  Preserve,
  ValidateOptions,
} from '../types';

export type Defined<T> = T extends undefined ? never : T;

export type NotNull<T> = T extends null ? never : T;

export interface ISchema<T, C = AnyObject, F extends Flags = any, D = any> {
  __flags: F;
  __context: C;
  __outputType: T;
  __default: D;

  cast(value: any, options: CastOptions<C>): T;
  validate(
    value: any,
    options?: ValidateOptions<C>,
    maybeCb?: Callback,
  ): Promise<T>;

  describe(options?: ResolveOptions<C>): SchemaFieldDescription;
  resolve(options: ResolveOptions<C>): ISchema<T, C, F>;
}

export type Thunk<T> = T | (() => T);

/* this seems to force TS to show the full type instead of all the wrapped generics */
export type _<T> = T extends {} ? { [k in keyof T]: T[k] } : T;

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

export type ResolveFlags<T, F extends Flags> = Preserve<F, 's'> extends never
  ? Extract<F, 'd'> extends never
    ? T
    : Defined<T>
  : never;

export type Concat<T, U> = NonNullable<T> & NonNullable<U> extends never
  ? never
  : (NonNullable<T> & NonNullable<U>) | Optionals<U>;

// // $ExpectType string | null
// type a = Concat<string | null, string>;

// type b = string  & (string | undefined)
