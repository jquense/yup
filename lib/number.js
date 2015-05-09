'use strict';
var SchemaObject = require('./mixed');
var locale = require('./locale.js').number;

var _require = require('./util/_');

var isDate = _require.isDate;
var inherits = _require.inherits;

module.exports = NumberSchema;

function NumberSchema() {
  if (!(this instanceof NumberSchema)) return new NumberSchema();

  SchemaObject.call(this, { type: 'number' });

  this.transforms.push(function (value) {
    if (this.isType(value)) return value;
    if (typeof value === 'boolean') return value ? 1 : 0;

    return isDate(value) ? +value : parseFloat(value);
  });
}

inherits(NumberSchema, SchemaObject, {

  _typeCheck: function _typeCheck(v) {
    return typeof v === 'number' && !(v !== +v) //isNaN check
    ;
  },

  min: (function (_min) {
    function min(_x, _x2) {
      return _min.apply(this, arguments);
    }

    min.toString = function () {
      return _min.toString();
    };

    return min;
  })(function (min, msg) {
    return this.test({
      name: 'min',
      exclusive: true,
      params: { min: min },
      message: msg || locale.min,
      test: function test(value) {
        return value == null || value >= min;
      }
    });
  }),

  max: (function (_max) {
    function max(_x3, _x4) {
      return _max.apply(this, arguments);
    }

    max.toString = function () {
      return _max.toString();
    };

    return max;
  })(function (max, msg) {
    return this.test({
      name: 'max',
      exclusive: true,
      params: { max: max },
      message: msg || locale.max,
      test: function test(value) {
        return value == null || value <= max;
      }
    });
  }),

  positive: function positive(msg) {
    return this.min(0, msg || locale.positive);
  },

  negative: function negative(msg) {
    return this.max(0, msg || locale.negative);
  },

  integer: function integer(msg) {
    msg = msg || locale.integer;

    return this.transform(function (v) {
      return v != null ? v | 0 : v;
    }).test('integer', msg, function (val) {
      return val === (val | 0);
    });
  },

  round: function round(method) {
    var avail = ['ceil', 'floor', 'round'];
    method = method && method.toLowerCase() || 'round';

    if (avail.indexOf(method.toLowerCase()) === -1) throw new TypeError('Only valid options for round() are: ' + avail.join(', '));

    return this.transform(function (v) {
      return v != null ? Math[method](v) : v;
    });
  }
});