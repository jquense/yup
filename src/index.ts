import MixedSchema, { create as mixedCreate } from './mixed';
import BoolSchema, { create as boolCreate } from './boolean';
import StringSchema, { create as stringCreate } from './string';
import NumberSchema, { create as numberCreate } from './number';
import DateSchema, { create as dateCreate } from './date';
import ObjectSchema, { AnyObject, create as objectCreate } from './object';
import ArraySchema, { create as arrayCreate } from './array';
import { create as refCreate } from './Reference';
import { create as lazyCreate } from './Lazy';
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

type SchemaOf<T> = T extends AnyObject
  ? ObjectSchema<{ [k in keyof T]: SchemaOf<T[k]> }>
  : T extends Array<infer E>
  ? ArraySchema<SchemaOf<E>>
  : BaseSchema<Maybe<T>, AnyObject, T>;

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
  BoolSchema,
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
