"use strict";
var SchemaObject = require("./mixed"),
    locale = require("./locale.js").number;

var isDate = function (obj) {
  return Object.prototype.toString.call(obj) === "[object Date]";
};

var _Number = module.exports = SchemaObject.extend({

  constructor: function () {
    if (!(this instanceof _Number)) return new _Number();

    SchemaObject.call(this);

    this._type = "number"

    // if ( !_.has(this, '_default') )
    //   this._default = 0
    ;
  },

  isType: function (v) {
    if (this._nullable && v === null) return true;
    return typeof v === "number" && !isNaN(v);
  },

  _coerce: function (value) {
    if (value == null) return value;
    if (this.isType(value)) return value;
    if (typeof value === "boolean") return value ? 1 : 0;

    return isDate(value) ? +value : parseFloat(value);
  },

  required: function (msg) {
    var _this = this;

    return this.validation({ hashKey: "required", message: msg || locale.required }, function (v) {
      return v != null && _this.isType(v);
    });
  },

  min: function (min, msg) {
    return this.validation({ hashKey: "min", params: { min: min }, message: msg || locale.min }, function (value) {
      return value >= min;
    });
  },

  max: function (max, msg) {
    return this.validation({ hashKey: "max", params: { max: max }, message: msg || locale.max }, function (value) {
      return value <= max;
    });
  },

  positive: function (max, msg) {
    return this.min(0, msg || locale.positive);
  },

  negative: function (max, msg) {
    return this.max(0, msg || locale.negative);
  },

  integer: function (msg) {
    msg = msg || locale.integer;

    return this.transform(function (v) {
      return v | 0;
    }).validation(msg, function (val) {
      return val === (val | 0);
    });
  },

  round: function (method) {
    var avail = ["ceil", "floor", "round"];
    method = method && method.toLowerCase() || "round";

    if (avail.indexOf(method.toLowerCase()) === -1) throw new TypeError("Only valid options for round() are: " + avail.join(", "));

    return this.transform(function (v) {
      return Math[method](v);
    });
  }

});