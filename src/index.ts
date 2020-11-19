import MixedSchema, {
  create as mixedCreate,
  SchemaSpec,
} from './mixed';
import BoolSchema, { create as boolCreate } from './boolean';
import StringSchema, { create as stringCreate } from './string';
import NumberSchema, { create as numberCreate } from './number';
import DateSchema, { create as dateCreate } from './date';
import ObjectSchema, { create as objectCreate, AssertsShape } from './object';
import ArraySchema, { create as arrayCreate } from './array';
import Ref, { create as refCreate } from './Reference';
import Lazy, { create as lazyCreate } from './Lazy';
import ValidationError from './ValidationError';
import reach from './util/reach';
import isSchema from './util/isSchema';
import setLocale from './setLocale';

function addMethod(schemaType: any, name: string, fn: any) {
  if (!schemaType || !isSchema(schemaType.prototype))
    throw new TypeError('You must provide a yup schema constructor function');

  if (typeof name !== 'string')
    throw new TypeError('A Method name must be provided');
  if (typeof fn !== 'function')
    throw new TypeError('Method function must be provided');

  schemaType.prototype[name] = fn;
}

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
  MixedSchema,
  BoolSchema,
  StringSchema,
  NumberSchema,
  DateSchema,
  ObjectSchema,
  ArraySchema,
};

// type TypeOf<T extends MixedSchema> = T extends { spec: infer TSpec }
//   ? TSpec extends SchemaSpec
//     ? ResolveCast<T['_tsType'], TSpec>
//     : never
//   : never;

// type Asserts<T extends MixedSchema> = TypeOf<T> &
//   (T extends { spec: infer TSpec }
//     ? TSpec extends SchemaSpec
//       ? ResolveRequired<TypeOf<T>, TSpec>
//       : never
//     : never);
