import mixed from './mixed';
import bool from './boolean';
import string from './string';
import number from './number';
import date from './date';
import object from './object';
import array from './array';
import Ref from './Reference';
import Lazy from './Lazy';
import ValidationError from './ValidationError';
import reach from './util/reach';
import isSchema from './util/isSchema';
import setLocale from './setLocale';
import locale from './locale';

let boolean = bool;
let ref = (key, options) => new Ref(key, options);

let lazy = fn => new Lazy(fn);

function addMethod(schemaType, name, fn) {
  if (!schemaType || !isSchema(schemaType.prototype))
    throw new TypeError('You must provide a yup schema constructor function');

  if (typeof name !== 'string')
    throw new TypeError('A Method name must be provided');
  if (typeof fn !== 'function')
    throw new TypeError('Method function must be provided');

  schemaType.prototype[name] = fn;
}

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
  locale,
  ValidationError,
};
