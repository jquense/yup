import type { Maybe, Optionals } from './types';
import type Reference from '../Reference';
import type { ISchema } from '../types';

export type ObjectShape = { [k: string]: ISchema<any> | Reference };

export type AnyObject = { [k: string]: any };

export type ResolveStrip<T extends ISchema<any>> = T extends ISchema<
  any,
  any,
  infer F
>
  ? Extract<F, 's'> extends never
    ? T['__outputType']
    : never
  : T['__outputType'];

export type TypeFromShape<S extends ObjectShape, _C> = {
  [K in keyof S]: S[K] extends ISchema<any>
    ? ResolveStrip<S[K]>
    : S[K] extends Reference<infer T>
    ? T
    : unknown;
};

export type DefaultFromShape<Shape extends ObjectShape> = {
  [K in keyof Shape]: Shape[K] extends ISchema<any>
    ? Shape[K]['__default']
    : undefined;
};

export type MergeObjectTypes<T extends Maybe<AnyObject>, U extends AnyObject> =
  | ({ [P in keyof T]: P extends keyof U ? U[P] : T[P] } & U)
  | Optionals<T>;

export type ConcatObjectTypes<
  T extends Maybe<AnyObject>,
  U extends Maybe<AnyObject>,
> =
  | ({
      [P in keyof T]: P extends keyof NonNullable<U> ? NonNullable<U>[P] : T[P];
    } & U)
  | Optionals<U>;

export type PartialDeep<T> = T extends
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | symbol
  | Date
  ? T | undefined
  : T extends Array<infer ArrayType>
  ? Array<PartialDeep<ArrayType>>
  : T extends ReadonlyArray<infer ArrayType>
  ? ReadonlyArray<ArrayType>
  : { [K in keyof T]?: PartialDeep<T[K]> };

type OptionalKeys<T extends {}> = {
  [k in keyof T]: undefined extends T[k] ? k : never;
}[keyof T];

type RequiredKeys<T extends object> = Exclude<keyof T, OptionalKeys<T>>;

export type MakePartial<T extends object> = {
  [k in OptionalKeys<T> as T[k] extends never ? never : k]?: T[k];
} & { [k in RequiredKeys<T> as T[k] extends never ? never : k]: T[k] };
