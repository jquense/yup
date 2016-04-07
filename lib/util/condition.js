'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require('./_');

var transform = _require.transform;
var has = _require.has;
var isSchema = _require.isSchema;


module.exports = Conditional;

var Conditional = function () {
  function Conditional(refs, options) {
    var _this = this;

    _classCallCheck(this, Conditional);

    var is = options.is;
    var then = options.then;
    var otherwise = options.otherwise;


    this.refs = [].concat(refs);

    if (typeof options === 'function') this.fn = options;else {
      (function () {
        if (!has(options, 'is')) throw new TypeError('`is:` is required for `when()` conditions');

        if (!options.then && !options.otherwise) throw new TypeError('either `then:` or `otherwise:` is required for `when()` conditions');

        var isFn = typeof is === 'function' ? is : function () {
          for (var _len = arguments.length, values = Array(_len), _key = 0; _key < _len; _key++) {
            values[_key] = arguments[_key];
          }

          return values.every(function (value) {
            return value === is;
          });
        };

        _this.fn = function () {
          for (var _len2 = arguments.length, values = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            values[_key2] = arguments[_key2];
          }

          var ctx = values.pop();
          return isFn.apply(undefined, values) ? ctx.concat(then) : ctx.concat(otherwise);
        };
      })();
    }
  }

  Conditional.prototype.getValue = function getValue(parent, context) {
    var values = this.refs.map(function (r) {
      return r.getValue(parent, context);
    });

    return values;
  };

  Conditional.prototype.resolve = function resolve(ctx, values) {
    var schema = this.fn.apply(ctx, values.concat(ctx));

    if (schema !== undefined && !isSchema(schema)) throw new TypeError('conditions must return a schema object');

    return schema || ctx;
  };

  return Conditional;
}();

module.exports = Conditional;