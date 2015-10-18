"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Reference = (function () {
  function Reference(string) {
    _classCallCheck(this, Reference);

    this._deps = [];
  }

  Reference.prototype["default"] = function _default() {};

  Reference.prototype.cast = function cast(value, parent, options) {
    return parent["default"](undefined).cast(value, options);
  };

  return Reference;
})();