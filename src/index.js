import MixedSchema from './mixed';
import BoolSchema from './boolean';
import StringSchema from './string';
import NumberSchema from './number';
import DateSchema from './date';
import ObjectSchema from './object';
import ArraySchema from './array';
import Ref from './Reference';
import Lazy from './Lazy';
import ValidationError from './ValidationError';
import reach from './util/reach';
import isSchema from './util/isSchema';
import setLocale from './setLocale';

let ref = (key, options) => new Ref(key, options);

let lazy = (fn) => new Lazy(fn);

function addMethod(schemaType, name, fn) {
  if (!schemaType || !isSchema(schemaType.prototype))
    throw new TypeError('You must provide a yup schema constructor function');

  if (typeof name !== 'string')
    throw new TypeError('A Method name must be provided');
  if (typeof fn !== 'function')
    throw new TypeError('Method function must be provided');

  schemaType.prototype[name] = fn;
}

const mixed = MixedSchema.create;
const string = StringSchema.create;
const number = NumberSchema.create;
const bool = BoolSchema.create;
const boolean = bool;
const date = DateSchema.create;
const object = ObjectSchema.create;
const array = ArraySchema.create;

export {
  MixedSchema,
  BoolSchema,
  StringSchema,
  NumberSchema,
  DateSchema,
  ObjectSchema,
  ArraySchema,
};

export {
  mixed,
  string,
  number,
  bool,
  boolean,
  date,
  object,
  array,
  ref,
  lazy,
  reach,
  isSchema,
  addMethod,
  setLocale,
  ValidationError,
};
