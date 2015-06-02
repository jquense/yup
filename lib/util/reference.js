"use strict";

var babelHelpers = require("./babelHelpers.js");

var Reference = (function () {
  function Reference(string) {
    babelHelpers.classCallCheck(this, Reference);

    this._deps = [];
  }

  Reference.prototype["default"] = function _default() {};

  Reference.prototype.cast = function cast(value, parent, options) {
    return parent["default"](undefined).cast(value, options);
  };

  return Reference;
})();