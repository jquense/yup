"use strict";
var SchemaObject = require("./mixed");
var locale = require("./locale.js").number;

var _require = require("./util/_");

var isDate = _require.isDate;
var inherits = _require.inherits;

module.exports = NumberSchema;

function NumberSchema() {
  if (!(this instanceof NumberSchema)) return new NumberSchema();

  SchemaObject.call(this, { type: "number" });

  this.transforms.push(function (value) {
    if (this.isType(value)) return value;
    if (typeof value === "boolean") return value ? 1 : 0;

    return isDate(value) ? +value : parseFloat(value);
  });
}

inherits(NumberSchema, SchemaObject, {

  _typeCheck: function (v) {
    return typeof v === "number" && !(v !== +v);
  },

  required: function (msg) {
    var _this = this;

    return this.validation({ hashKey: "required", message: msg || locale.required }, function (v) {
      return v != null && _this.isType(v);
    });
  },

  min: function (min, msg) {
    return this.validation({ hashKey: "min", params: { min: min }, message: msg || locale.min }, function (value) {
      return value == null || value >= min;
    });
  },

  max: function (max, msg) {
    return this.validation({ hashKey: "max", params: { max: max }, message: msg || locale.max }, function (value) {
      return value == null || value <= max;
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