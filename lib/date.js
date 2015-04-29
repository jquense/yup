'use strict';
var MixedSchema = require('./mixed');
var isoParse = require('./util/isodate');
var locale = require('./locale.js').date;

var _require = require('./util/_');

var isDate = _require.isDate;
var inherits = _require.inherits;

var invalidDate = new Date('');

module.exports = DateSchema;

function DateSchema() {
  if (!(this instanceof DateSchema)) return new DateSchema();

  MixedSchema.call(this, { type: 'date' });

  this.transforms.push(function (value) {
    if (this.isType(value)) return isDate(value) ? new Date(value) : value;

    value = isoParse(value);
    return value ? new Date(value) : invalidDate;
  });
}

inherits(DateSchema, MixedSchema, {

  _typeCheck: function _typeCheck(v) {
    return isDate(v) && !isNaN(v.getTime());
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
    var limit = this.cast(min);

    if (!this._typeCheck(limit)) throw new TypeError('`min` must be a Date or a value that can be `cast()` to a Date');

    return this.test({
      name: 'min',
      exclusive: true,
      message: msg || locale.min,
      params: { min: min },
      test: function test(value) {
        return value && value >= limit;
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
    var limit = this.cast(max);

    if (!this._typeCheck(limit)) throw new TypeError('`max` must be a Date or a value that can be `cast()` to a Date');

    return this.test({
      name: 'max',
      exclusive: true,
      message: msg || locale.max,
      params: { max: max },
      test: function test(value) {
        return !value || value <= limit;
      }
    });
  })

});