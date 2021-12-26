import type Reference from '../Reference';
import type { Maybe, Optionals } from '../types';
import type { ISchema } from './types';

export type ObjectShape = { [k: string]: ISchema<any> | Reference };

export type AnyObject = { [k: string]: any };

export type TypeFromShape<S extends ObjectShape, C> = {
  [K in keyof S]: S[K] extends ISchema<any, C> ? S[K]['__outputType'] : unknown;
};

type DefaultedKeys<S extends ObjectShape> = {
  [K in keyof S]: S[K] extends ISchema<any>
    ? undefined extends S[K]['__default']
      ? never
      : K
    : never;
}[keyof S];

export type DefaultFromShape<Shape extends ObjectShape> = {
  [K in keyof Shape]: Shape[K] extends ISchema<any>
    ? Shape[K]['__default']
    : undefined;
};

export type MergeObjectTypes<T extends Maybe<AnyObject>, U extends AnyObject> =
  | ({ [P in keyof T]: P extends keyof U ? U[P] : T[P] } & U)
  | Optionals<T>;

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
