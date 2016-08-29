'use strict';

exports.__esModule = true;
exports.default = NumberSchema;

var _inherits = require('./util/inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _mixed = require('./mixed');

var _mixed2 = _interopRequireDefault(_mixed);

var _locale = require('./locale.js');

var _isAbsent = require('./util/isAbsent');

var _isAbsent2 = _interopRequireDefault(_isAbsent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var isNaN = function isNaN(value) {
  return value != +value;
};

var isInteger = function isInteger(val) {
  return (0, _isAbsent2.default)(val) || val === (val | 0);
};

function NumberSchema() {
  var _this = this;

  if (!(this instanceof NumberSchema)) return new NumberSchema();

  _mixed2.default.call(this, { type: 'number' });

  this.withMutation(function () {
    _this.transform(function (value) {
      if (this.isType(value)) return value;

      var parsed = parseFloat(value);
      if (this.isType(parsed)) return parsed;

      return NaN;
    });
  });
}

(0, _inherits2.default)(NumberSchema, _mixed2.default, {
  _typeCheck: function _typeCheck(value) {
    if (value instanceof Number) value = value.valueOf();

    return typeof value === 'number' && !isNaN(value);
  },
  min: function min(_min, msg) {
    return this.test({
      name: 'min',
      exclusive: true,
      params: { min: _min },
      message: msg || _locale.number.min,
      test: function test(value) {
        return (0, _isAbsent2.default)(value) || value >= this.resolve(_min);
      }
    });
  },
  max: function max(_max, msg) {
    return this.test({
      name: 'max',
      exclusive: true,
      params: { max: _max },
      message: msg || _locale.number.max,
      test: function test(value) {
        return (0, _isAbsent2.default)(value) || value <= this.resolve(_max);
      }
    });
  },
  positive: function positive(msg) {
    return this.min(0, msg || _locale.number.positive);
  },
  negative: function negative(msg) {
    return this.max(0, msg || _locale.number.negative);
  },
  integer: function integer(msg) {
    msg = msg || _locale.number.integer;

    return this.test('integer', msg, isInteger);
  },
  truncate: function truncate() {
    return this.transform(function (value) {
      return !(0, _isAbsent2.default)(value) ? value | 0 : value;
    });
  },
  round: function round(method) {
    var avail = ['ceil', 'floor', 'round', 'trunc'];
    method = method && method.toLowerCase() || 'round';

    // this exists for symemtry with the new Math.trunc
    if (method === 'trunc') return this.truncate();

    if (avail.indexOf(method.toLowerCase()) === -1) throw new TypeError('Only valid options for round() are: ' + avail.join(', '));

    return this.transform(function (value) {
      return !(0, _isAbsent2.default)(value) ? Math[method](value) : value;
    });
  }
});
module.exports = exports['default'];