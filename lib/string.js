'use strict';

exports.__esModule = true;
exports.default = StringSchema;

var _inherits = require('./util/inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _mixed = require('./mixed');

var _mixed2 = _interopRequireDefault(_mixed);

var _locale = require('./locale');

var _isAbsent = require('./util/isAbsent');

var _isAbsent2 = _interopRequireDefault(_isAbsent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var rEmail = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
var rUrl = /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;

var hasLength = function hasLength(value) {
  return (0, _isAbsent2.default)(value) || value.length > 0;
};
var isTrimmed = function isTrimmed(value) {
  return (0, _isAbsent2.default)(value) || value === value.trim();
};

function StringSchema() {
  var _this = this;

  if (!(this instanceof StringSchema)) return new StringSchema();

  _mixed2.default.call(this, { type: 'string' });

  this.withMutation(function () {
    _this.transform(function (value) {
      if (this.isType(value)) return value;
      return value != null && value.toString ? value.toString() : value;
    });
  });
}

(0, _inherits2.default)(StringSchema, _mixed2.default, {
  _typeCheck: function _typeCheck(value) {
    if (value instanceof String) value = value.valueOf();

    return typeof value === 'string';
  },
  required: function required(msg) {
    var next = _mixed2.default.prototype.required.call(this, msg || _locale.mixed.required);

    return next.test('required', msg || _locale.mixed.required, hasLength);
  },
  length: function length(_length, msg) {
    return this.test({
      name: 'length',
      exclusive: true,
      message: msg || _locale.string.length,
      params: { length: _length },
      test: function test(value) {
        return (0, _isAbsent2.default)(value) || value.length === this.resolve(_length);
      }
    });
  },
  min: function min(_min, msg) {
    return this.test({
      name: 'min',
      exclusive: true,
      message: msg || _locale.string.min,
      params: { min: _min },
      test: function test(value) {
        return (0, _isAbsent2.default)(value) || value.length >= this.resolve(_min);
      }
    });
  },
  max: function max(_max, msg) {
    return this.test({
      name: 'max',
      exclusive: true,
      message: msg || _locale.string.max,
      params: { max: _max },
      test: function test(value) {
        return (0, _isAbsent2.default)(value) || value.length <= this.resolve(_max);
      }
    });
  },
  matches: function matches(regex) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var excludeEmptyString = false,
        message = void 0;

    if (options.message || options.hasOwnProperty('excludeEmptyString')) {
      excludeEmptyString = options.excludeEmptyString;
      message = options.message;
    } else message = options;

    return this.test({
      message: message || _locale.string.matches,
      params: { regex: regex },
      test: function test(value) {
        return (0, _isAbsent2.default)(value) || value === '' && excludeEmptyString || regex.test(value);
      }
    });
  },
  email: function email(msg) {
    return this.matches(rEmail, {
      message: msg || _locale.string.email,
      excludeEmptyString: true
    });
  },
  url: function url(msg) {
    return this.matches(rUrl, {
      message: msg || _locale.string.url,
      excludeEmptyString: true
    });
  },


  //-- transforms --
  ensure: function ensure() {
    return this.default('').transform(function (val) {
      return val === null ? '' : val;
    });
  },
  trim: function trim(msg) {
    msg = msg || _locale.string.trim;

    return this.transform(function (val) {
      return val != null ? val.trim() : val;
    }).test('trim', msg, isTrimmed);
  },
  lowercase: function lowercase(msg) {
    return this.transform(function (value) {
      return !(0, _isAbsent2.default)(value) ? value.toLowerCase() : value;
    }).test({
      name: 'string_case',
      exclusive: true,
      message: msg || _locale.string.lowercase,
      test: function test(value) {
        return (0, _isAbsent2.default)(value) || value === value.toLowerCase();
      }
    });
  },
  uppercase: function uppercase(msg) {
    return this.transform(function (value) {
      return !(0, _isAbsent2.default)(value) ? value.toUpperCase() : value;
    }).test({
      name: 'string_case',
      exclusive: true,
      message: msg || _locale.string.uppercase,
      test: function test(value) {
        return (0, _isAbsent2.default)(value) || value === value.toUpperCase();
      }
    });
  }
});
module.exports = exports['default'];