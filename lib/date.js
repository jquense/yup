'use strict';

exports.__esModule = true;

var _mixed = require('./mixed');

var _mixed2 = _interopRequireDefault(_mixed);

var _inherits = require('./util/inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _isodate = require('./util/isodate');

var _isodate2 = _interopRequireDefault(_isodate);

var _locale = require('./locale.js');

var _isAbsent = require('./util/isAbsent');

var _isAbsent2 = _interopRequireDefault(_isAbsent);

var _Reference = require('./Reference');

var _Reference2 = _interopRequireDefault(_Reference);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var invalidDate = new Date('');

var isDate = function isDate(obj) {
  return Object.prototype.toString.call(obj) === '[object Date]';
};

exports.default = DateSchema;


function DateSchema() {
  var _this = this;

  if (!(this instanceof DateSchema)) return new DateSchema();

  _mixed2.default.call(this, { type: 'date' });

  this.withMutation(function () {
    _this.transform(function (value) {
      if (this.isType(value)) return isDate(value) ? new Date(value) : value;

      value = (0, _isodate2.default)(value);
      return value ? new Date(value) : invalidDate;
    });
  });
}

(0, _inherits2.default)(DateSchema, _mixed2.default, {
  _typeCheck: function _typeCheck(v) {
    return isDate(v) && !isNaN(v.getTime());
  },
  min: function min(_min, msg) {
    var limit = _min;

    if (!_Reference2.default.isRef(limit)) {
      limit = this.cast(_min);
      if (!this._typeCheck(limit)) throw new TypeError('`min` must be a Date or a value that can be `cast()` to a Date');
    }

    return this.test({
      name: 'min',
      exclusive: true,
      message: msg || _locale.date.min,
      params: { min: _min },
      test: function test(value) {
        return (0, _isAbsent2.default)(value) || value >= this.resolve(limit);
      }
    });
  },
  max: function max(_max, msg) {
    var limit = _max;

    if (!_Reference2.default.isRef(limit)) {
      limit = this.cast(_max);
      if (!this._typeCheck(limit)) throw new TypeError('`max` must be a Date or a value that can be `cast()` to a Date');
    }

    return this.test({
      name: 'max',
      exclusive: true,
      message: msg || _locale.date.max,
      params: { max: _max },
      test: function test(value) {
        return (0, _isAbsent2.default)(value) || value <= this.resolve(limit);
      }
    });
  }
});
module.exports = exports['default'];