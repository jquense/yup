'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = SchemaType;

var _has = require('lodash/has');

var _has2 = _interopRequireDefault(_has);

var _cloneDeepWith = require('lodash/cloneDeepWith');

var _cloneDeepWith2 = _interopRequireDefault(_cloneDeepWith);

var _toArray = require('lodash/toArray');

var _toArray2 = _interopRequireDefault(_toArray);

var _locale = require('./locale');

var _Condition = require('./Condition');

var _Condition2 = _interopRequireDefault(_Condition);

var _runValidations = require('./util/runValidations');

var _runValidations2 = _interopRequireDefault(_runValidations);

var _merge = require('./util/merge');

var _merge2 = _interopRequireDefault(_merge);

var _isSchema = require('./util/isSchema');

var _isSchema2 = _interopRequireDefault(_isSchema);

var _isAbsent = require('./util/isAbsent');

var _isAbsent2 = _interopRequireDefault(_isAbsent);

var _createValidation = require('./util/createValidation');

var _createValidation2 = _interopRequireDefault(_createValidation);

var _printValue = require('./util/printValue');

var _printValue2 = _interopRequireDefault(_printValue);

var _Reference = require('./Reference');

var _Reference2 = _interopRequireDefault(_Reference);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var notEmpty = function notEmpty(value) {
  return !(0, _isAbsent2.default)(value);
};

function extractTestParams(name, message, test) {
  var opts = name;

  if (typeof message === 'function') {
    test = message;message = _locale.mixed.default;name = null;
  }

  if (typeof name === 'function') {
    test = name;message = _locale.mixed.default;name = null;
  }

  if (typeof name === 'string' || name === null) opts = { name: name, test: test, message: message, exclusive: false };

  if (typeof opts.test !== 'function') throw new TypeError('`test` is a required parameters');

  return opts;
}

function SchemaType() {
  var _this = this;

  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  if (!(this instanceof SchemaType)) return new SchemaType();

  this._deps = [];
  this._conditions = [];
  this._options = { abortEarly: true, recursive: true };
  this._exclusive = Object.create(null);
  this._whitelist = new Set();
  this._blacklist = new Set();
  this.tests = [];
  this.transforms = [];

  this.withMutation(function () {
    _this.typeError(_locale.mixed.notType);
  });

  if ((0, _has2.default)(options, 'default')) this._defaultDefault = options.default;

  this._type = options.type || 'mixed';
}

SchemaType.prototype = {

  __isYupSchema__: true,

  constructor: SchemaType,

  clone: function clone() {
    var _this2 = this;

    if (this._mutate) return this;

    // if the nested value is a schema we can skip cloning, since
    // they are already immutable
    return (0, _cloneDeepWith2.default)(this, function (value) {
      if ((0, _isSchema2.default)(value) && value !== _this2) return value;
    });
  },
  label: function label(_label) {
    var next = this.clone();
    next._label = _label;
    return next;
  },
  meta: function meta(obj) {
    if (arguments.length === 0) return this._meta;

    var next = this.clone();
    next._meta = _extends(next._meta || {}, obj);
    return next;
  },
  withMutation: function withMutation(fn) {
    this._mutate = true;
    var result = fn(this);
    this._mutate = false;
    return result;
  },
  concat: function concat(schema) {
    if (!schema) return this;

    if (schema._type !== this._type && this._type !== 'mixed') throw new TypeError('You cannot `concat()` schema\'s of different types: ' + this._type + ' and ' + schema._type);
    var cloned = this.clone();
    var next = (0, _merge2.default)(this.clone(), schema.clone());

    // undefined isn't merged over, but is a valid value for default
    if ((0, _has2.default)(schema, '_default')) next._default = schema._default;

    next.tests = cloned.tests;
    next._exclusive = cloned._exclusive;

    // manually add the new tests to ensure
    // the deduping logic is consistent
    schema.tests.forEach(function (fn) {
      next = next.test(fn.TEST);
    });

    next._type = schema._type;

    return next;
  },
  isType: function isType(v) {
    if (this._nullable && v === null) return true;
    return !this._typeCheck || this._typeCheck(v);
  },
  resolve: function resolve(_ref) {
    var context = _ref.context,
        parent = _ref.parent;

    if (this._conditions.length) {
      return this._conditions.reduce(function (schema, match) {
        return match.resolve(schema, match.getValue(parent, context));
      }, this);
    }

    return this;
  },
  cast: function cast(value) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var resolvedSchema = this.resolve(options);
    var result = resolvedSchema._cast(value, options);

    if (value !== undefined && options.assert !== false && resolvedSchema.isType(result) !== true) {
      var formattedValue = (0, _printValue2.default)(value);
      var formattedResult = (0, _printValue2.default)(result);
      throw new TypeError('The value of ' + (options.path || 'field') + ' could not be cast to a value ' + ('that satisfies the schema type: "' + resolvedSchema._type + '". \n\n') + ('attempted value: ' + formattedValue + ' \n') + (formattedResult !== formattedValue ? 'result of cast: ' + formattedResult : ''));
    }

    return result;
  },
  _cast: function _cast(rawValue) {
    var _this3 = this;

    var value = rawValue === undefined ? rawValue : this.transforms.reduce(function (value, fn) {
      return fn.call(_this3, value, rawValue);
    }, rawValue);

    if (value === undefined && (0, _has2.default)(this, '_default')) {
      value = this.default();
    }

    return value;
  },
  validate: function validate(value) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var schema = this.resolve(options);
    return schema._validate(value, options);
  },
  _validate: function _validate(_value) {
    var _this4 = this;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var value = _value;
    var originalValue = options.originalValue != null ? options.originalValue : _value;

    var isStrict = this._option('strict', options);
    var endEarly = this._option('abortEarly', options);

    var path = options.path;
    var label = this._label;

    if (!isStrict) {
      value = this._cast(value, _extends({ assert: false }, options));
    }
    // value is cast, we can check if it meets type requirements
    var validationParams = { value: value, path: path, schema: this, options: options, label: label, originalValue: originalValue };
    var initialTests = [];

    if (this._typeError) initialTests.push(this._typeError(validationParams));

    if (this._whitelistError) initialTests.push(this._whitelistError(validationParams));

    if (this._blacklistError) initialTests.push(this._blacklistError(validationParams));

    return (0, _runValidations2.default)({ validations: initialTests, endEarly: endEarly, value: value, path: path }).then(function (value) {
      return (0, _runValidations2.default)({
        path: path,
        value: value,
        endEarly: endEarly,
        validations: _this4.tests.map(function (fn) {
          return fn(validationParams);
        })
      });
    });
  },
  isValid: function isValid(value, options) {
    return this.validate(value, options).then(function () {
      return true;
    }).catch(function (err) {
      if (err.name === 'ValidationError') return false;

      throw err;
    });
  },
  getDefault: function getDefault(_ref2) {
    var context = _ref2.context,
        parent = _ref2.parent;

    return this._resolve(context, parent).default();
  },
  default: function _default(def) {
    if (arguments.length === 0) {
      var defaultValue = (0, _has2.default)(this, '_default') ? this._default : this._defaultDefault;

      return typeof defaultValue === 'function' ? defaultValue.call(this) : (0, _cloneDeepWith2.default)(defaultValue);
    }

    var next = this.clone();
    next._default = def;
    return next;
  },
  strict: function strict() {
    var next = this.clone();
    next._options.strict = true;
    return next;
  },
  required: function required(msg) {
    return this.test('required', msg || _locale.mixed.required, notEmpty);
  },
  nullable: function nullable(value) {
    var next = this.clone();
    next._nullable = value === false ? false : true;
    return next;
  },
  transform: function transform(fn) {
    var next = this.clone();
    next.transforms.push(fn);
    return next;
  },


  /**
   * Adds a test function to the schema's queue of tests.
   * tests can be exclusive or non-exclusive.
   *
   * - exclusive tests, will replace any existing tests of the same name.
   * - non-exclusive: can be stacked
   *
   * If a non-exclusive test is added to a schema with an exclusive test of the same name
   * the exclusive test is removed and further tests of the same name will be stacked.
   *
   * If an exclusive test is added to a schema with non-exclusive tests of the same name
   * the previous tests are removed and further tests of the same name will replace each other.
   */
  test: function test(name, message, _test) {
    var opts = extractTestParams(name, message, _test),
        next = this.clone();

    var validate = (0, _createValidation2.default)(opts);

    var isExclusive = opts.exclusive || opts.name && next._exclusive[opts.name] === true;

    if (opts.exclusive && !opts.name) {
      throw new TypeError('Exclusive tests must provide a unique `name` identifying the test');
    }

    next._exclusive[opts.name] = !!opts.exclusive;

    next.tests = next.tests.filter(function (fn) {
      if (fn.TEST_NAME === opts.name) {
        if (isExclusive) return false;
        if (fn.TEST.test === validate.TEST.test) return false;
      }
      return true;
    });

    next.tests.push(validate);

    return next;
  },
  when: function when(keys, options) {
    var next = this.clone(),
        deps = [].concat(keys).map(function (key) {
      return new _Reference2.default(key);
    });

    deps.forEach(function (dep) {
      if (!dep.isContext) next._deps.push(dep.key);
    });

    next._conditions.push(new _Condition2.default(deps, options));

    return next;
  },
  typeError: function typeError(message) {
    var next = this.clone();

    next._typeError = (0, _createValidation2.default)({
      name: 'typeError',
      message: message,
      test: function test(value) {
        if (value !== undefined && !this.schema.isType(value)) return this.createError({
          params: {
            type: this.schema._type
          }
        });
        return true;
      }
    });
    return next;
  },
  oneOf: function oneOf(enums) {
    var message = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _locale.mixed.oneOf;

    var next = this.clone();

    enums.forEach(function (val) {
      if (next._blacklist.has(val)) next._blacklist.delete(val);
      next._whitelist.add(val);
    });

    next._whitelistError = (0, _createValidation2.default)({
      message: message,
      name: 'oneOf',
      test: function test(value) {
        var valids = this.schema._whitelist;
        if (valids.size && !(value === undefined || valids.has(value))) return this.createError({
          params: {
            values: (0, _toArray2.default)(valids).join(', ')
          }
        });
        return true;
      }
    });

    return next;
  },
  notOneOf: function notOneOf(enums) {
    var message = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _locale.mixed.notOneOf;

    var next = this.clone();

    enums.forEach(function (val) {
      next._whitelist.delete(val);
      next._blacklist.add(val);
    });

    next._blacklistError = (0, _createValidation2.default)({
      message: message,
      name: 'notOneOf',
      test: function test(value) {
        var invalids = this.schema._blacklist;
        if (invalids.size && invalids.has(value)) return this.createError({
          params: {
            values: (0, _toArray2.default)(invalids).join(', ')
          }
        });
        return true;
      }
    });

    return next;
  },
  strip: function strip() {
    var strip = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

    var next = this.clone();
    next._strip = strip;
    return next;
  },
  _option: function _option(key, overrides) {
    return (0, _has2.default)(overrides, key) ? overrides[key] : this._options[key];
  },
  describe: function describe() {
    var next = this.clone();

    return {
      type: next._type,
      meta: next._meta,
      label: next._label,
      tests: next.tests.map(function (fn) {
        return fn.TEST_NAME;
      }, {})
    };
  }
};

var aliases = {
  oneOf: ['equals', 'is'],
  notOneOf: ['not', 'nope']
};

Object.keys(aliases).forEach(function (method) {
  aliases[method].forEach(function (alias) {
    return SchemaType.prototype[alias] = SchemaType.prototype[method];
  });
});
module.exports = exports['default'];