'use strict';
var MixedSchema = require('./mixed');
var isoParse = require('./util/isodate');
var locale = require('./locale.js').date;
var isAbsent = require('./util/isAbsent');

var _require = require('./util/_');

var isDate = _require.isDate;
var inherits = _require.inherits;

var invalidDate = new Date('');

module.exports = DateSchema;

function DateSchema() {
  var _this = this;

  if (!(this instanceof DateSchema)) return new DateSchema();

  MixedSchema.call(this, { type: 'date' });

  this.withMutation(function () {
    _this.transform(function (value) {
      if (this.isType(value)) return isDate(value) ? new Date(value) : value;

      value = isoParse(value);
      return value ? new Date(value) : invalidDate;
    });
  });
}

inherits(DateSchema, MixedSchema, {

  _typeCheck: function _typeCheck(v) {
    return isDate(v) && !isNaN(v.getTime());
  },

  min: function min(_min, msg) {
    var limit = this.cast(_min);

    if (!this._typeCheck(limit)) throw new TypeError('`min` must be a Date or a value that can be `cast()` to a Date');

    return this.test({
      name: 'min',
      exclusive: true,
      message: msg || locale.min,
      params: { min: _min },
      test: function test(value) {
        return isAbsent(value) || value >= this.resolve(limit);
      }
    });
  },

  max: function max(_max, msg) {
    var limit = this.cast(_max);

    if (!this._typeCheck(limit)) throw new TypeError('`max` must be a Date or a value that can be `cast()` to a Date');

    return this.test({
      name: 'max',
      exclusive: true,
      message: msg || locale.max,
      params: { max: _max },
      test: function test(value) {
        return isAbsent(value) || value <= this.resolve(limit);
      }
    });
  }

});