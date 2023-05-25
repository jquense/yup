export type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N;

export type Maybe<T> = T | null | undefined;

export type Preserve<T, U> = T extends U ? U : never;

export type Optionals<T> = Extract<T, null | undefined>;

export type Defined<T> = T extends undefined ? never : T;

export type NotNull<T> = T extends null ? never : T;

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

export type ResolveFlags<T, F extends Flags, D = T> = Extract<
  F,
  'd'
> extends never
  ? T
  : D extends undefined
  ? T
  : Defined<T>;

export type Concat<T, U> = NonNullable<T> & NonNullable<U> extends never
  ? never
  : (NonNullable<T> & NonNullable<U>) | Optionals<U>;
