"use strict";
var expr = require("property-expr");
var strReg = /\$\{\s*(\w+)\s*\}/g;

module.exports = function strInterpolate(str, obj) {
  if (arguments.length === 1) return function (obj) {
    return str.replace(strReg, function (_, key) {
      return expr.getter(key)(obj) || "";
    });
  };

  return str.replace(strReg, function (_, key) {
    return expr.getter(key)(obj) || "";
  });
};