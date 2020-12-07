import type { AnyObject, Preserve } from '../types';

export type Defined<T> = T extends undefined ? never : T;

export type NotNull<T> = T extends null ? never : T;

export type TypedSchema = {
  __type: any;
  __outputType: any;
  __out: any;
};

export type TypeOf<TSchema extends TypedSchema> = TSchema['__type'];

export type Asserts<TSchema extends TypedSchema> = TSchema['__out'];

export type Thunk<T> = T | (() => T);

export type If<T, Y, N> = T extends undefined ? Y : N;

//
// Schema Config
//

export type Flags = 's' | 'd' | '';

export type HasFlag<T, F extends Flags> = Preserve<T, F> extends never
  ? never
  : true;

export interface Config<C = AnyObject, F extends Flags = ''> {
  context: C;
  flags: F;
}

export type SetFlag<C extends Config, F extends Flags> = C extends Config<
  infer Context,
  infer Old
>
  ? Config<Context, Old | F>
  : never;

export type UnsetFlag<C extends Config, F extends Flags> = C extends Config<
  infer Context,
  infer Old
>
  ? Config<Context, Exclude<Old, F>>
  : never;

export type ResolveFlags<T, F extends Flags> = Preserve<F, 'd'> extends never
  ? T
  : Defined<T>;
