'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var SchemaObject = require('./mixed');
var locale = require('./locale.js').number;
var isAbsent = require('./util/isAbsent');

var _require = require('./util/_');

var isDate = _require.isDate;
var inherits = _require.inherits;


module.exports = NumberSchema;

var isInteger = function isInteger(val) {
  return isAbsent(val) || val === (val | 0);
};

function NumberSchema() {
  var _this = this;

  if (!(this instanceof NumberSchema)) return new NumberSchema();

  SchemaObject.call(this, { type: 'number' });

  this.withMutation(function () {
    _this.transform(function (value) {
      if (this.isType(value)) return value;
      if (typeof value === 'boolean') return value ? 1 : 0;

      return isDate(value) ? +value : parseFloat(value);
    });
  });
}

inherits(NumberSchema, SchemaObject, {
  _typeCheck: function _typeCheck(v) {
    if (typeof v === 'number' && !(v !== +v)) return true;
    if ((typeof v === 'undefined' ? 'undefined' : _typeof(v)) === 'object' && v instanceof Number) return true;

    return false;
  },
  min: function min(_min, msg) {
    return this.test({
      name: 'min',
      exclusive: true,
      params: { min: _min },
      message: msg || locale.min,
      test: function test(value) {
        return isAbsent(value) || value >= this.resolve(_min);
      }
    });
  },
  max: function max(_max, msg) {
    return this.test({
      name: 'max',
      exclusive: true,
      params: { max: _max },
      message: msg || locale.max,
      test: function test(value) {
        return isAbsent(value) || value <= this.resolve(_max);
      }
    });
  },
  positive: function positive(msg) {
    return this.min(0, msg || locale.positive);
  },
  negative: function negative(msg) {
    return this.max(0, msg || locale.negative);
  },
  integer: function integer(msg) {
    msg = msg || locale.integer;

    return this.transform(function (value) {
      return !isAbsent(value) ? value | 0 : value;
    }).test('integer', msg, isInteger);
  },
  round: function round(method) {
    var avail = ['ceil', 'floor', 'round'];
    method = method && method.toLowerCase() || 'round';

    if (avail.indexOf(method.toLowerCase()) === -1) throw new TypeError('Only valid options for round() are: ' + avail.join(', '));

    return this.transform(function (value) {
      return !isAbsent(value) ? Math[method](value) : value;
    });
  }
});