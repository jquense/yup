import MixedSchema, {
  create as mixedCreate,
  MixedOptions,
  TypeGuard,
} from './mixed';
import BooleanSchema, { create as boolCreate } from './boolean';
import StringSchema, { create as stringCreate } from './string';
import NumberSchema, { create as numberCreate } from './number';
import DateSchema, { create as dateCreate } from './date';
import ObjectSchema, { AnyObject, create as objectCreate } from './object';
import ArraySchema, { create as arrayCreate } from './array';
import TupleSchema, { create as tupleCreate } from './tuple';
import { create as refCreate } from './Reference';
import { create as lazyCreate } from './Lazy';
import ValidationError from './ValidationError';
import reach, { getIn } from './util/reach';
import isSchema from './util/isSchema';
import setLocale, { LocaleObject } from './setLocale';
import Schema, {
  AnySchema,
  CastOptions as BaseCastOptions,
  SchemaRefDescription,
  SchemaInnerTypeDescription,
  SchemaObjectDescription,
  SchemaLazyDescription,
  SchemaFieldDescription,
  SchemaDescription,
} from './schema';
import type { InferType, ISchema, Message, ValidateOptions } from './types';

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

export type AnyObjectSchema = ObjectSchema<any, any, any, any>;

export type CastOptions = Omit<BaseCastOptions, 'path' | 'resolved'>;

export type {
  AnyObject,
  InferType,
  InferType as Asserts,
  ISchema,
  Message,
  AnySchema,
  MixedOptions,
  TypeGuard as MixedTypeGuard,
  SchemaRefDescription,
  SchemaInnerTypeDescription,
  SchemaObjectDescription,
  SchemaLazyDescription,
  SchemaFieldDescription,
  SchemaDescription,
  LocaleObject,
  ValidateOptions,
};

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
  tupleCreate as tuple,
  reach,
  getIn,
  isSchema,
  addMethod,
  setLocale,
  ValidationError,
};

export {
  Schema,
  MixedSchema,
  BooleanSchema,
  StringSchema,
  NumberSchema,
  DateSchema,
  ObjectSchema,
  ArraySchema,
  TupleSchema,
};

export type {
  CreateErrorOptions,
  TestContext,
  TestFunction,
  TestOptions,
  TestConfig,
} from './util/createValidation';

export type {
  ObjectShape,
  TypeFromShape,
  DefaultFromShape,
  MakePartial,
} from './util/objectTypes';

export type {
  Maybe,
  Flags,
  Optionals,
  Thunk,
  ToggleDefault,
  Defined,
  NotNull,
  UnsetFlag,
  SetFlag,
} from './util/types';
