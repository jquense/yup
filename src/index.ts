import MixedSchema, { create as mixedCreate } from './mixed';
import BooleanSchema, { create as boolCreate } from './boolean';
import StringSchema, { create as stringCreate } from './string';
import NumberSchema, { create as numberCreate } from './number';
import DateSchema, { create as dateCreate } from './date';
import ObjectSchema, { AnyObject, create as objectCreate } from './object';
import ArraySchema, { create as arrayCreate } from './array';
import { create as refCreate } from './Reference';
import Lazy, { create as lazyCreate } from './Lazy';
import ValidationError from './ValidationError';
import reach from './util/reach';
import isSchema from './util/isSchema';
import setLocale from './setLocale';
import BaseSchema, { AnySchema } from './schema';
import type { TypeOf, Asserts } from './util/types';
import { Maybe } from './types';

function addMethod<T extends AnySchema>(
  schemaType: (...arg: any[]) => T,
  name: string,
  fn: (this: T, ...args: any[]) => T,
): void;
function addMethod<T extends new (...args: any) => AnySchema>(
  schemaType: T,
  name: string,
  fn: (this: InstanceType<T>, ...args: any[]) => InstanceType<T>,
): void;
function addMethod(schemaType: any, name: string, fn: any) {
  if (!schemaType || !isSchema(schemaType.prototype))
    throw new TypeError('You must provide a yup schema constructor function');

  if (typeof name !== 'string')
    throw new TypeError('A Method name must be provided');
  if (typeof fn !== 'function')
    throw new TypeError('Method function must be provided');

  schemaType.prototype[name] = fn;
}

type ObjectSchemaOf<T extends AnyObject, CustomTypes = never> = ObjectSchema<
  {
    [k in keyof T]-?: T[k] extends Array<infer E>
      ? ArraySchema<SchemaOf<E, CustomTypes> | Lazy<SchemaOf<E, CustomTypes>>>
      : T[k] extends Date | CustomTypes
      ? BaseSchema<Maybe<T[k]>, AnyObject, T[k]>
      : T[k] extends AnyObject
      ? // we can't use  ObjectSchema<{ []: SchemaOf<T[k]> }> b/c TS produces a union of two schema
        ObjectSchemaOf<T[k], CustomTypes> | Lazy<ObjectSchemaOf<T[k], CustomTypes>>
      : BaseSchema<Maybe<T[k]>, AnyObject, T[k]>;
  }
>;

type SchemaOf<T, CustomTypes = never> = T extends Array<infer E>
  ? ArraySchema<SchemaOf<E, CustomTypes> | Lazy<SchemaOf<E, CustomTypes>>>
  : T extends Date | CustomTypes
  ? BaseSchema<Maybe<T>, AnyObject, T>
  : T extends AnyObject
  ? ObjectSchemaOf<T, CustomTypes>
  : BaseSchema<Maybe<T>, AnyObject, T>;

export type AnyObjectSchema = ObjectSchema<any, any, any, any>;

export type { SchemaOf, TypeOf, Asserts, Asserts as InferType, AnySchema };

export {
  mixedCreate as mixed,
  boolCreate as bool,
  boolCreate as boolean,
  stringCreate as string,
  numberCreate as number,
  dateCreate as date,
  objectCreate as object,
  arrayCreate as array,
  refCreate as ref,
  lazyCreate as lazy,
  reach,
  isSchema,
  addMethod,
  setLocale,
  ValidationError,
};

export {
  BaseSchema,
  MixedSchema,
  BooleanSchema,
  StringSchema,
  NumberSchema,
  DateSchema,
  ObjectSchema,
  ArraySchema,
};

export type {
  CreateErrorOptions,
  TestContext,
  TestFunction,
  TestOptions,
  TestConfig,
} from './util/createValidation';
