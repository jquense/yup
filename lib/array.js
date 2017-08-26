'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _templateObject = _taggedTemplateLiteralLoose(['', '[', ']'], ['', '[', ']']);

var _typeName = require('type-name');

var _typeName2 = _interopRequireDefault(_typeName);

var _inherits = require('./util/inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _isAbsent = require('./util/isAbsent');

var _isAbsent2 = _interopRequireDefault(_isAbsent);

var _isSchema = require('./util/isSchema');

var _isSchema2 = _interopRequireDefault(_isSchema);

var _makePath = require('./util/makePath');

var _makePath2 = _interopRequireDefault(_makePath);

var _mixed = require('./mixed');

var _mixed2 = _interopRequireDefault(_mixed);

var _locale = require('./locale.js');

var _runValidations = require('./util/runValidations');

var _runValidations2 = _interopRequireDefault(_runValidations);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _taggedTemplateLiteralLoose(strings, raw) { strings.raw = raw; return strings; }

var hasLength = function hasLength(value) {
  return !(0, _isAbsent2.default)(value) && value.length > 0;
};

exports.default = ArraySchema;


function ArraySchema(type) {
  var _this = this;

  if (!(this instanceof ArraySchema)) return new ArraySchema(type);

  _mixed2.default.call(this, { type: 'array' });

  // `undefined` specifically means uninitialized, as opposed to
  // "no subtype"
  this._subType = undefined;

  this.withMutation(function () {
    _this.transform(function (values) {
      if (typeof values === 'string') try {
        values = JSON.parse(values);
      } catch (err) {
        values = null;
      }

      return this.isType(values) ? values : null;
    });

    if (type) _this.of(type);
  });
}

(0, _inherits2.default)(ArraySchema, _mixed2.default, {
  _typeCheck: function _typeCheck(v) {
    return Array.isArray(v);
  },
  _cast: function _cast(_value, _opts) {
    var _this2 = this;

    var value = _mixed2.default.prototype._cast.call(this, _value, _opts);

    //should ignore nulls here
    if (!this._typeCheck(value) || !this._subType) return value;

    return value.map(function (v) {
      return _this2._subType.cast(v, _opts);
    });
  },
  _validate: function _validate(_value) {
    var _this3 = this;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var errors = [];
    var path = options.path;
    var subType = this._subType;
    var endEarly = this._option('abortEarly', options);
    var recursive = this._option('recursive', options);

    var originalValue = options.originalValue != null ? options.originalValue : _value;

    return _mixed2.default.prototype._validate.call(this, _value, options).catch((0, _runValidations.propagateErrors)(endEarly, errors)).then(function (value) {
      if (!recursive || !subType || !_this3._typeCheck(value)) {
        if (errors.length) throw errors[0];
        return value;
      }

      originalValue = originalValue || value;

      var validations = value.map(function (item, idx) {
        var path = (0, _makePath2.default)(_templateObject, options.path, idx);

        // object._validate note for isStrict explanation
        var innerOptions = _extends({}, options, {
          path: path,
          strict: true,
          parent: value,
          originalValue: originalValue[idx]
        });

        if (subType.validate) return subType.validate(item, innerOptions);

        return true;
      });

      return (0, _runValidations2.default)({
        path: path,
        value: value,
        errors: errors,
        endEarly: endEarly,
        validations: validations
      });
    });
  },
  of: function of(schema) {
    var next = this.clone();

    if (schema !== false && !(0, _isSchema2.default)(schema)) throw new TypeError('`array.of()` sub-schema must be a valid yup schema, or `false` to negate a current sub-schema. ' + 'not: ' + (0, _typeName2.default)(schema));

    next._subType = schema;

    return next;
  },
  required: function required(msg) {
    var next = _mixed2.default.prototype.required.call(this, msg || _locale.mixed.required);

    return next.test('required', msg || _locale.mixed.required, hasLength);
  },
  min: function min(_min, message) {
    message = message || _locale.array.min;

    return this.test({
      message: message,
      name: 'min',
      exclusive: true,
      params: { min: _min },
      test: function test(value) {
        return (0, _isAbsent2.default)(value) || value.length >= this.resolve(_min);
      }
    });
  },
  max: function max(_max, message) {
    message = message || _locale.array.max;
    return this.test({
      message: message,
      name: 'max',
      exclusive: true,
      params: { max: _max },
      test: function test(value) {
        return (0, _isAbsent2.default)(value) || value.length <= this.resolve(_max);
      }
    });
  },
  ensure: function ensure() {
    return this.default(function () {
      return [];
    }).transform(function (val) {
      return val === null ? [] : [].concat(val);
    });
  },
  compact: function compact(rejector) {
    var reject = !rejector ? function (v) {
      return !!v;
    } : function (v, i, a) {
      return !rejector(v, i, a);
    };

    return this.transform(function (values) {
      return values != null ? values.filter(reject) : values;
    });
  }
});
module.exports = exports['default'];