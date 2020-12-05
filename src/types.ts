import type { AnySchema } from './schema';
import type Lazy from './Lazy';

export type AnyObject = Record<string, any>;

export type SchemaLike = AnySchema | Lazy<any>;

export type Callback<T = any> = (err: Error | null, value?: T) => void;

export type TransformFunction<T extends AnySchema> = (
  this: T,
  value: any,
  originalValue: any,
  schema: T,
) => any;

export interface ValidateOptions<TContext = {}> {
  /**
   * Only validate the input, skipping type casting and transformation. Default - false
   */
  strict?: boolean;
  /**
   * Return from validation methods on the first error rather than after all validations run. Default - true
   */
  abortEarly?: boolean;
  /**
   * Remove unspecified keys from objects. Default - false
   */
  stripUnknown?: boolean;
  /**
   * When false validations will not descend into nested schema (relevant for objects or arrays). Default - true
   */
  recursive?: boolean;
  /**
   * Any context needed for validating schema conditions (see: when())
   */
  context?: TContext;
}

export interface InternalOptions<TContext = {}>
  extends ValidateOptions<TContext> {
  __validating?: boolean;
  originalValue?: any;
  parent?: any;
  path?: string;
  sync?: boolean;
  from?: { schema: AnySchema; value: any }[];
}

export interface MessageParams {
  path: string;
  value: any;
  originalValue: any;
  label: string;
  type: string;
}

export type Message<Extra extends Record<string, unknown> = any> =
  | string
  | ((params: Extra & MessageParams) => unknown)
  | Record<PropertyKey, unknown>;

export type ExtraParams = Record<string, unknown>;

export type AnyMessageParams = MessageParams & ExtraParams;

export type Maybe<T> = T | null | undefined;

export type Preserve<T, U> = T extends U ? U : never;

export type Optionals<T> = Extract<T, null | undefined>;
