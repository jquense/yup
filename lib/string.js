"use strict";
var MixedSchema = require("./mixed");

var _require = require("./locale.js");

var mixed = _require.mixed;
var locale = _require.string;
var inherits = require("./util/_").inherits;

var rEmail = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
var rUrl = /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;

module.exports = StringSchema;

function StringSchema() {
  if (!(this instanceof StringSchema)) return new StringSchema();

  MixedSchema.call(this, { type: "string" });
}

inherits(StringSchema, MixedSchema, {

  _typeCheck: function (value) {
    return typeof value === "string";
  },

  _coerce: function (value) {
    if (this.isType(value)) return value;
    return value == null ? "" : value.toString ? value.toString() : "" + value;
  },

  required: function (msg) {
    return this.validation({ name: "required", exclusive: true, message: msg || mixed.required }, function (value) {
      return value != null && value.length > 0;
    });
  },

  min: function (min, msg) {
    msg = msg || locale.min;

    return this.validation({ name: "min", exclusive: true, message: msg, params: { min: min } }, function (value) {
      return value == null || value.length >= min;
    });
  },

  max: function (max, msg) {
    msg = msg || locale.max;
    return this.validation({ name: "max", exclusive: true, message: msg, params: { max: max } }, function (value) {
      return value == null || value.length <= max;
    });
  },

  matches: function (regex, msg) {
    msg = msg || locale.matches;

    return this.validation({ message: msg, params: { regex: regex } }, function (value) {
      return value == null || regex.test(value);
    });
  },

  email: function (msg) {
    msg = msg || locale.email;

    return this.matches(rEmail, msg);
  },

  url: function (msg) {
    msg = msg || locale.url;

    return this.matches(rUrl, msg);
  },

  //-- transforms --
  trim: function (msg) {
    msg = msg || locale.trim;

    return this.transform(function (val) {
      return val != null ? val.trim() : val;
    }).validation(msg, function (val) {
      return val == null || val === val.trim();
    });
  },

  lowercase: function (msg) {
    msg = msg || locale.lowercase;

    return this.transform(function (val) {
      return val != null ? val.toLowerCase() : val;
    }).validation(msg, function (val) {
      return val == null || val === val.toLowerCase();
    });
  },

  uppercase: function (msg) {
    msg = msg || locale.uppercase;

    return this.transform(function (val) {
      return val != null ? val.toUpperCase() : val;
    }).validation(msg, function (val) {
      return val == null || val === val.toUpperCase();
    });
  }
});