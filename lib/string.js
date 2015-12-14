'use strict';
var MixedSchema = require('./mixed');

var _require = require('./locale.js');

var mixed = _require.mixed;
var locale = _require.string;
var inherits = require('./util/_').inherits;

var rEmail = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
var rUrl = /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;

module.exports = StringSchema;

function StringSchema() {
  var self = this;
  if (!(this instanceof StringSchema)) return new StringSchema();

  MixedSchema.call(this, { type: 'string' });

  this.transforms.push(function (value) {
    if (this.isType(value)) return value;
    return value == null ? '' : value.toString ? value.toString() : '' + value;
  });
}

inherits(StringSchema, MixedSchema, {

  _isEmpty: function _isEmpty(value) {
    return value == null || value == '';
  },

  _typeCheck: function _typeCheck(value) {
    return typeof value === 'string';
  },

  required: function required(msg) {
    var next = MixedSchema.prototype.required.call(this, msg || mixed.required);

    return next.min(1, msg || mixed.required);
  },

  min: function min(_min, msg) {
    var self = this;

    return this.test({
      name: 'min',
      exclusive: true,
      message: msg || locale.min,
      params: { min: _min },
      test: function test(value) {
        return self._isEmpty(value) || value.length >= _min;
      }
    });
  },

  max: function max(_max, msg) {
    var self = this;

    return this.test({
      name: 'max',
      exclusive: true,
      message: msg || locale.max,
      params: { max: _max },
      test: function test(value) {
        return self._isEmpty(value) || value.length <= _max;
      }
    });
  },

  matches: function matches(regex, msg) {
    var self = this;

    return this.test({
      message: msg || locale.matches,
      params: { regex: regex },
      test: function test(value) {
        return self._isEmpty(value) || regex.test(value);
      }
    });
  },

  email: function email(msg) {
    return this.matches(rEmail, msg || locale.email);
  },

  url: function url(msg) {
    return this.matches(rUrl, msg || locale.url);
  },

  //-- transforms --
  trim: function trim(msg) {
    var self = this;

    msg = msg || locale.trim;

    return this.transform(function (val) {
      return !self._isEmpty(value) ? val.trim() : val;
    }).test('trim', msg, function (val) {
      return self._isEmpty(value) || val === val.trim();
    });
  },

  lowercase: function lowercase(msg) {
    var self = this;

    return this.transform(function (val) {
      return !self._isEmpty(value) ? val.toLowerCase() : val;
    }).test({
      name: 'string_case',
      exclusive: true,
      message: msg || locale.lowercase,
      test: function test(val) {
        return self._isEmpty(value) || val === val.toLowerCase();
      }
    });
  },

  uppercase: function uppercase(msg) {
    var self = this;

    return this.transform(function (val) {
      return !self._isEmpty(value) ? val.toUpperCase() : val;
    }).test({
      name: 'string_case',
      exclusive: true,
      message: msg || locale.uppercase,
      test: function test(val) {
        return self._isEmpty(value) || val === val.toUpperCase();
      }
    });
  }
});
