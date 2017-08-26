'use strict';

exports.__esModule = true;
exports.array = exports.object = exports.boolean = exports.date = exports.number = exports.string = exports.mixed = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _printValue = require('./util/printValue');

var _printValue2 = _interopRequireDefault(_printValue);

var _customLocale = require('./customLocale');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var customLocale = (0, _customLocale.getLocale)();

var mixed = exports.mixed = _extends({
  default: '${path} is invalid',
  required: '${path} is a required field',
  oneOf: '${path} must be one of the following values: ${values}',
  notOneOf: '${path} must not be one of the following values: ${values}',
  notType: function notType(_ref) {
    var path = _ref.path,
        type = _ref.type,
        value = _ref.value,
        originalValue = _ref.originalValue;

    var isCast = originalValue != null && originalValue !== value;
    var msg = path + ' must be a `' + type + '` type, ' + ('but the final value was: `' + (0, _printValue2.default)(value, true) + '`') + (isCast ? ' (cast from the value `' + (0, _printValue2.default)(originalValue, true) + '`).' : '.');

    if (value === null) {
      msg += '\n If "null" is intended as an empty value be sure to mark the schema as `.nullable()`';
    }

    return msg;
  }
}, customLocale.mixed);

var string = exports.string = _extends({
  required: '${path} is a required field',
  length: '${path} must be exactly ${length} characters',
  min: '${path} must be at least ${min} characters',
  max: '${path} must be at most ${max} characters',
  matches: '${path} must match the following: "${regex}"',
  email: '${path} must be a valid email',
  url: '${path} must be a valid URL',
  trim: '${path} must be a trimmed string',
  lowercase: '${path} must be a lowercase string',
  uppercase: '${path} must be a upper case string'
}, customLocale.string);

var number = exports.number = _extends({
  min: '${path} must be greater than or equal to ${min}',
  max: '${path} must be less than or equal to ${max}',
  positive: '${path} must be a positive number',
  negative: '${path} must be a negative number',
  integer: '${path} must be an integer'
}, customLocale.number);

var date = exports.date = _extends({
  min: '${path} field must be later than ${min}',
  max: '${path} field must be at earlier than ${max}'
}, customLocale.date);

var boolean = exports.boolean = _extends({}, customLocale.boolean);

var object = exports.object = _extends({
  noUnknown: '${path} field cannot have keys not specified in the object shape'
}, customLocale.object);

var array = exports.array = _extends({
  required: '${path} is a required field',
  min: '${path} field must have at least ${min} items',
  max: '${path} field must have less than ${max} items'
}, customLocale.array);

exports.default = {
  mixed: mixed,
  string: string,
  number: number,
  date: date,
  object: object,
  array: array,
  boolean: boolean
};