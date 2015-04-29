'use strict';

var babelHelpers = require('./babelHelpers.js');

var _require = require('./_');

var has = _require.has;
var isSchema = _require.isSchema;

module.exports = Conditional;

var Conditional = (function () {
  function Conditional(key, type, options) {
    babelHelpers.classCallCheck(this, Conditional);
    var is = options.is;
    var then = options.then;
    var otherwise = options.otherwise;

    this.key = key;

    if (typeof options === 'function') this.fn = options;else {
      if (!has(options, 'is')) throw new TypeError('`is:` is required for `when()` conditions');

      if (!options.then && !options.otherwise) throw new TypeError('either `then:` or `otherwise:` is required for `when()` conditions');

      if (options.then && options.then._type !== type || options.otherwise && options.otherwise._type !== type) throw new TypeError('cannot create polymorphic conditionals, `then` and `otherwise` must be the same type: ' + type);

      is = typeof is === 'function' ? is : (function (is, value) {
        return is === value;
      }).bind(null, is);

      this.fn = function (value, ctx) {
        return is(value) ? ctx.concat(then) : ctx.concat(otherwise);
      };
    }
  }

  Conditional.prototype.resolve = function resolve(ctx, value) {
    var schema = this.fn.call(ctx, value, ctx);

    if (schema !== undefined && !isSchema(schema)) throw new TypeError('conditions must return a schema object');

    return schema || ctx;
  };

  return Conditional;
})();

module.exports = Conditional;