"use strict";
var babelHelpers = require("./babelHelpers.js");
var has = require("./has");

module.exports = Conditional;

var Conditional = (function () {
  function Conditional(key, current, options) {
    babelHelpers.classCallCheck(this, Conditional);

    var type = current._type;

    this.key = key;

    if (typeof options === "function") this.fn = options;else {
      if (!has(options, "is")) throw new TypeError(".is must be provided");
      if (!options.then && !options.otherwise) throw new TypeError(".then or .otherwise must be provided");
      if (options.then && options.then._type !== type || options.otherwise && options.otherwise._type !== type) throw new TypeError("cannot return polymorphic conditionals");

      this.is = options.is;
      this.then = options.then;
      this.otherwise = options.otherwise;
    }
  }

  Conditional.prototype.resolve = function resolve(ctx, value) {
    var schema, matches, then, otherwise;

    if (this.fn) {
      schema = this.fn.call(ctx, value, ctx);
      if (schema !== undefined && !schema.__isYupSchema__) throw new TypeError("conditions must return a schema object");

      return schema || ctx;
    }

    matches = typeof this.is === "function" ? this.is(value) : this.is === value;

    then = this.then ? ctx.concat(this.then) : ctx;
    otherwise = this.otherwise ? ctx.concat(this.otherwise) : ctx;

    return matches ? then : otherwise;
  };

  return Conditional;
})();

module.exports = Conditional;