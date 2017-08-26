'use strict';

exports.__esModule = true;

var _has = require('lodash/has');

var _has2 = _interopRequireDefault(_has);

var _isSchema = require('./util/isSchema');

var _isSchema2 = _interopRequireDefault(_isSchema);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function callOrConcat(schema) {
  if (typeof schema === 'function') return schema;

  return function (base) {
    return base.concat(schema);
  };
}

var Conditional = function () {
  function Conditional(refs, options) {
    _classCallCheck(this, Conditional);

    var is = options.is,
        then = options.then,
        otherwise = options.otherwise;


    this.refs = [].concat(refs);

    then = callOrConcat(then);
    otherwise = callOrConcat(otherwise);

    if (typeof options === 'function') this.fn = options;else {
      if (!(0, _has2.default)(options, 'is')) throw new TypeError('`is:` is required for `when()` conditions');

      if (!options.then && !options.otherwise) throw new TypeError('either `then:` or `otherwise:` is required for `when()` conditions');

      var isFn = typeof is === 'function' ? is : function () {
        for (var _len = arguments.length, values = Array(_len), _key = 0; _key < _len; _key++) {
          values[_key] = arguments[_key];
        }

        return values.every(function (value) {
          return value === is;
        });
      };

      this.fn = function () {
        for (var _len2 = arguments.length, values = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          values[_key2] = arguments[_key2];
        }

        var currentSchema = values.pop();
        var option = isFn.apply(undefined, values) ? then : otherwise;

        return option(currentSchema);
      };
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

    if (schema !== undefined && !(0, _isSchema2.default)(schema)) throw new TypeError('conditions must return a schema object');

    return schema || ctx;
  };

  return Conditional;
}();

exports.default = Conditional;
module.exports = exports['default'];