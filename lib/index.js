'use strict';

exports.__esModule = true;
exports.ValidationError = exports.addMethod = exports.isSchema = exports.reach = exports.lazy = exports.ref = exports.array = exports.object = exports.date = exports.boolean = exports.bool = exports.number = exports.string = exports.mixed = undefined;

var _mixed = require('./mixed');

var _mixed2 = _interopRequireDefault(_mixed);

var _boolean = require('./boolean');

var _boolean2 = _interopRequireDefault(_boolean);

var _string = require('./string');

var _string2 = _interopRequireDefault(_string);

var _number = require('./number');

var _number2 = _interopRequireDefault(_number);

var _date = require('./date');

var _date2 = _interopRequireDefault(_date);

var _object = require('./object');

var _object2 = _interopRequireDefault(_object);

var _array = require('./array');

var _array2 = _interopRequireDefault(_array);

var _Reference = require('./Reference');

var _Reference2 = _interopRequireDefault(_Reference);

var _Lazy = require('./Lazy');

var _Lazy2 = _interopRequireDefault(_Lazy);

var _ValidationError = require('./ValidationError');

var _ValidationError2 = _interopRequireDefault(_ValidationError);

var _reach = require('./util/reach');

var _reach2 = _interopRequireDefault(_reach);

var _isSchema = require('./util/isSchema');

var _isSchema2 = _interopRequireDefault(_isSchema);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var boolean = _boolean2.default;
var ref = function ref(key, options) {
  return new _Reference2.default(key, options);
};

var lazy = function lazy(fn) {
  return new _Lazy2.default(fn);
};

function addMethod(schemaType, name, fn) {
  if (!schemaType || !(0, _isSchema2.default)(schemaType.prototype)) throw new TypeError('You must provide a yup schema constructor function');

  if (typeof name !== 'string') throw new TypeError('A Method name must be provided');
  if (typeof fn !== 'function') throw new TypeError('Method function must be provided');

  schemaType.prototype[name] = fn;
}

exports.mixed = _mixed2.default;
exports.string = _string2.default;
exports.number = _number2.default;
exports.bool = _boolean2.default;
exports.boolean = boolean;
exports.date = _date2.default;
exports.object = _object2.default;
exports.array = _array2.default;
exports.ref = ref;
exports.lazy = lazy;
exports.reach = _reach2.default;
exports.isSchema = _isSchema2.default;
exports.addMethod = addMethod;
exports.ValidationError = _ValidationError2.default;
exports.default = {
  mixed: _mixed2.default,
  string: _string2.default,
  number: _number2.default,
  bool: _boolean2.default,
  boolean: boolean,
  date: _date2.default,
  object: _object2.default,
  array: _array2.default,
  ref: ref,
  lazy: lazy,
  reach: _reach2.default,
  isSchema: _isSchema2.default,
  addMethod: addMethod,
  ValidationError: _ValidationError2.default
};