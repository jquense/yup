'use strict';
var mixed = require('./mixed'),
    bool = require('./boolean');

var isSchema = function isSchema(schema) {
  return schema && !!schema.__isYupSchema__;
};

module.exports = {
  mixed: mixed,
  string: require('./string'),
  number: require('./number'),
  boolean: bool,
  bool: bool,
  date: require('./date'),
  object: require('./object'),
  array: require('./array'),

  reach: require('./util/reach'),

  ValidationError: require('./util/validation-error'),

  isSchema: isSchema,

  addMethod: function addMethod(schemaType, name, fn) {
    if (!schemaType || !isSchema(schemaType.prototype)) throw new TypeError('You must provide a yup schema constructor function');

    if (typeof name !== 'string') throw new TypeError('A Method name must be provided');
    if (typeof fn !== 'function') throw new TypeError('Method function must be provided');

    schemaType.prototype[name] = fn;
  }
};