"use strict";
var MixedSchema = require("./mixed"),
    locale = require("./locale.js").boolean,
    inherits = require("./util/_").inherits;

var isBool = function (v) {
  return typeof v === "boolean";
};

module.exports = BooleanSchema;

function BooleanSchema() {
  if (!(this instanceof BooleanSchema)) return new BooleanSchema();

  MixedSchema.call(this, { type: "boolean" });

  this.transforms.push(function (value) {
    if (this.isType(value)) return value;
    return /true|1/i.test(value);
  });
}

inherits(BooleanSchema, MixedSchema, {

  _typeCheck: isBool,

  _coerce: function (value) {
    if (this.isType(value)) return value;
    return /true|1/i.test(value);
  }

});