'use strict';

exports.__esModule = true;

var _mixed = require('./mixed');

var _mixed2 = _interopRequireDefault(_mixed);

var _boolean = require('./boolean');

var _boolean2 = _interopRequireDefault(_boolean);

var _Reference = require('./Reference');

var _Reference2 = _interopRequireDefault(_Reference);

var _Lazy = require('./Lazy');

var _Lazy2 = _interopRequireDefault(_Lazy);

var _isSchema = require('./util/isSchema');

var _isSchema2 = _interopRequireDefault(_isSchema);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  mixed: _mixed2.default,
  string: require('./string'),
  number: require('./number'),
  boolean: _boolean2.default,
  bool: _boolean2.default,
  date: require('./date'),
  object: require('./object'),
  array: require('./array'),

  reach: require('./util/reach'),

  ValidationError: require('./ValidationError'),
  ref: function ref(key, options) {
    return new _Reference2.default(key, options);
  },
  lazy: function lazy(fn) {
    return new _Lazy2.default(fn);
  },

  isSchema: _isSchema2.default,

  addMethod: function addMethod(schemaType, name, fn) {
    if (!schemaType || !(0, _isSchema2.default)(schemaType.prototype)) throw new TypeError('You must provide a yup schema constructor function');

    if (typeof name !== 'string') throw new TypeError('A Method name must be provided');
    if (typeof fn !== 'function') throw new TypeError('Method function must be provided');

    schemaType.prototype[name] = fn;
  }
};
module.exports = exports['default'];