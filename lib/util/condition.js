'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _require = require('./_');

var has = _require.has;
var isSchema = _require.isSchema;
var getter = require('property-expr').getter;

module.exports = Conditional;

var Conditional = (function () {
  function Conditional(key, type, options) {
    _classCallCheck(this, Conditional);

    var is = options.is;
    var then = options.then;
    var otherwise = options.otherwise;
    var prefix = options.contextPrefix || '$';

    this.prefix = prefix;
    this.key = key;
    this.isContext = key.indexOf(prefix) === 0;

    if (typeof options === 'function') this.fn = options;else {
      if (!has(options, 'is')) throw new TypeError('`is:` is required for `when()` conditions');

      if (!options.then && !options.otherwise) throw new TypeError('either `then:` or `otherwise:` is required for `when()` conditions');

      is = typeof is === 'function' ? is : (function (is, value) {
        return is === value;
      }).bind(null, is);

      this.fn = function (value, ctx) {
        return is(value) ? ctx.concat(then) : ctx.concat(otherwise);
      };
    }
  }

  Conditional.prototype.getValue = function getValue(parent, context) {
    var path = this.isContext ? this.key.slice(this.prefix.length) : this.key;

    if (this.isContext && !context || !this.isContext && !context && !parent) throw new Error('missing the context necessary to cast this value');

    return getter(path)(this.isContext ? context : parent || context);
  };

  Conditional.prototype.resolve = function resolve(ctx, value) {
    var schema = this.fn.call(ctx, value, ctx);

    if (schema !== undefined && !isSchema(schema)) throw new TypeError('conditions must return a schema object');

    return schema || ctx;
  };

  return Conditional;
})();

module.exports = Conditional;