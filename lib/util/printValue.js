'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = printValue;

var _isFunction = require('lodash/isFunction');

var _isFunction2 = _interopRequireDefault(_isFunction);

var _isMap = require('lodash/isMap');

var _isMap2 = _interopRequireDefault(_isMap);

var _isSet = require('lodash/isSet');

var _isSet2 = _interopRequireDefault(_isSet);

var _isWeakMap = require('lodash/isWeakMap');

var _isWeakMap2 = _interopRequireDefault(_isWeakMap);

var _isWeakSet = require('lodash/isWeakSet');

var _isWeakSet2 = _interopRequireDefault(_isWeakSet);

var _isSymbol = require('lodash/isSymbol');

var _isSymbol2 = _interopRequireDefault(_isSymbol);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var toString = Object.prototype.toString;
var toISOString = Date.prototype.toISOString;
var errorToString = Error.prototype.toString;
var regExpToString = RegExp.prototype.toString;
var symbolToString = Symbol.prototype.toString;

var SYMBOL_REGEXP = /^Symbol\((.*)\)(.*)$/;
var NEWLINE_REGEXP = /\n/gi;

var getSymbols = Object.getOwnPropertySymbols || function (obj) {
  return [];
};

function printNumber(val) {
  if (val != +val) return 'NaN';
  var isNegativeZero = val === 0 && 1 / val < 0;
  return isNegativeZero ? '-0' : '' + val;
}

function printFunction(val) {
  return '[Function ' + (val.name || 'anonymous') + ']';
}

function printSymbol(val) {
  return symbolToString.call(val).replace(SYMBOL_REGEXP, 'Symbol($1)');
}

function printError(val) {
  return '[' + errorToString.call(val) + ']';
}

function printSimpleValue(val) {
  var quoteStrings = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  if (val === true || val === false) return '' + val;
  if (val === undefined) return 'undefined';
  if (val === null) return 'null';

  var typeOf = typeof val === 'undefined' ? 'undefined' : _typeof(val);

  if (typeOf === 'number') return printNumber(val);
  if (typeOf === 'string') return quoteStrings ? '"' + val + '"' : val;
  if ((0, _isFunction2.default)(val)) return printFunction(val);
  if ((0, _isSymbol2.default)(val)) return printSymbol(val);

  var tag = toString.call(val);
  if (tag === '[object Date]') return isNaN(val.getTime()) ? String(val) : toISOString.call(val);
  if (tag === '[object Error]' || val instanceof Error) return printError(val);
  if (tag === '[object RegExp]') return regExpToString.call(val);

  return null;
}

function printValue(value, quoteStrings) {
  var result = printSimpleValue(value, quoteStrings);
  if (result !== null) return result;

  return JSON.stringify(value, function (key, value) {
    var result = printSimpleValue(this[key], quoteStrings);
    if (result !== null) return result;
    return value;
  }, 2);
}
module.exports = exports['default'];