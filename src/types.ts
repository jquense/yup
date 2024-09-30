import type { ResolveOptions } from './Condition';
import type {
  AnySchema,
  CastOptionalityOptions,
  CastOptions,
  SchemaFieldDescription,
  SchemaSpec,
} from './schema';
import type { Test } from './util/createValidation';
import type { AnyObject } from './util/objectTypes';
import type { Flags } from './util/types';

export type { AnyObject, AnySchema };

export interface ISchema<T, C = any, F extends Flags = any, D = any> {
  __flags: F;
  __context: C;
  __outputType: T;
  __default: D;

  cast(value: any, options?: CastOptions<C>): T;
  cast(value: any, options: CastOptionalityOptions<C>): T | null | undefined;

  validate(value: any, options?: ValidateOptions<C>): Promise<T>;

  asNestedTest(config: NestedTestConfig): Test;

  describe(options?: ResolveOptions<C>): SchemaFieldDescription;
  resolve(options: ResolveOptions<C>): ISchema<T, C, F>;
}

export type DefaultThunk<T, C = any> = T | ((options?: ResolveOptions<C>) => T);

export type InferType<T extends ISchema<any, any>> = T['__outputType'];

export type TransformFunction<T extends AnySchema> = (
  this: T,
  value: any,
  originalValue: any,
  schema: T,
) => any;

export interface Ancester<TContext> {
  schema: ISchema<any, TContext>;
  value: any;
}
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
   * When true ValidationError instance won't include stack trace information. Default - false
   */
  disableStackTrace?: boolean;
  /**
   * Any context needed for validating schema conditions (see: when())
   */
  context?: TContext;
}

export interface InternalOptions<TContext = any>
  extends ValidateOptions<TContext> {
  __validating?: boolean;
  originalValue?: any;
  index?: number;
  key?: string;
  parent?: any;
  path?: string;
  sync?: boolean;
  from?: Ancester<TContext>[];
}

export interface MessageParams {
  path: string;
  value: any;
  originalValue: any;
  originalPath: string;
  label: string;
  type: string;
  spec: SchemaSpec<any> & Record<string, unknown>;
}

export type Message<Extra extends Record<string, unknown> = any> =
  | string
  | ((params: Extra & MessageParams) => unknown)
  | Record<PropertyKey, unknown>;

export type ExtraParams = Record<string, unknown>;

export type AnyMessageParams = MessageParams & ExtraParams;

export interface NestedTestConfig {
  options: InternalOptions<any>;
  parent: any;
  originalParent: any;
  parentPath: string | undefined;
  key?: string;
  index?: number;
}
