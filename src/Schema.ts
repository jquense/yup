import { ResolveOptions } from './Condition';
import {
  ValidateOptions,
  Callback,
  ExtraParams
} from './types';

export interface CastOptions {
  parent?: any;
  context?: {};
  assert?: boolean;
  // XXX: should be private?
  path?: string;
}

export type SchemaSpec<TDefault> = {
  nullable?: boolean;
  default: TDefault | (() => TDefault);
  hasDefault?: boolean;
  abortEarly?: boolean;
  strip?: boolean;
  strict?: boolean;
  recursive?: boolean;
  label?: string | undefined;
  meta?: any;
};

export interface SchemaRefDescription {
  type: 'ref';
  key: string;
}

export interface SchemaInnerTypeDescription extends SchemaDescription {
  innerType?: SchemaFieldDescription;
}

export interface SchemaObjectDescription extends SchemaDescription {
  fields: Record<string, SchemaFieldDescription>;
}

export type SchemaFieldDescription =
  | SchemaDescription
  | SchemaRefDescription
  | SchemaObjectDescription
  | SchemaInnerTypeDescription;

export interface SchemaDescription {
  type: string;
  label?: string;
  meta: object;
  oneOf: unknown[];
  notOneOf: unknown[];
  tests: Array<{ name?: string; params: ExtraParams | undefined }>;
}

export default interface Schema {
  __isYupSchema__: boolean;
  type: string;
  // cast(value: any): any;
  // validate(value: any): any;
  validate(value: any, options: ValidateOptions): Promise<any>;
  describe(): any;
  validate(
    value: any,
    options: ValidateOptions | undefined,
    callback: Callback,
  ): void;

  resolve(options: ResolveOptions): any;
  cast(value: any, options?: CastOptions): any;

  describe(): SchemaDescription;
}
