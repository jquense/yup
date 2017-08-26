'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _templateObject = _taggedTemplateLiteralLoose(['', '.', ''], ['', '.', '']);

exports.default = ObjectSchema;

var _has = require('lodash/has');

var _has2 = _interopRequireDefault(_has);

var _omit = require('lodash/omit');

var _omit2 = _interopRequireDefault(_omit);

var _snakeCase2 = require('lodash/snakeCase');

var _snakeCase3 = _interopRequireDefault(_snakeCase2);

var _camelCase2 = require('lodash/camelCase');

var _camelCase3 = _interopRequireDefault(_camelCase2);

var _mapKeys = require('lodash/mapKeys');

var _mapKeys2 = _interopRequireDefault(_mapKeys);

var _transform = require('lodash/transform');

var _transform2 = _interopRequireDefault(_transform);

var _propertyExpr = require('property-expr');

var _mixed = require('./mixed');

var _mixed2 = _interopRequireDefault(_mixed);

var _locale = require('./locale.js');

var _sortFields = require('./util/sortFields');

var _sortFields2 = _interopRequireDefault(_sortFields);

var _sortByKeyOrder = require('./util/sortByKeyOrder');

var _sortByKeyOrder2 = _interopRequireDefault(_sortByKeyOrder);

var _inherits = require('./util/inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _makePath = require('./util/makePath');

var _makePath2 = _interopRequireDefault(_makePath);

var _runValidations = require('./util/runValidations');

var _runValidations2 = _interopRequireDefault(_runValidations);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _taggedTemplateLiteralLoose(strings, raw) { strings.raw = raw; return strings; }

var isObject = function isObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
};

function unknown(ctx, value) {
  var known = Object.keys(ctx.fields);
  return Object.keys(value).filter(function (key) {
    return known.indexOf(key) === -1;
  });
}

function ObjectSchema(spec) {
  var _this2 = this;

  if (!(this instanceof ObjectSchema)) return new ObjectSchema(spec);

  _mixed2.default.call(this, { type: 'object', default: function _default() {
      var _this = this;

      var dft = (0, _transform2.default)(this._nodes, function (obj, key) {
        obj[key] = _this.fields[key].default ? _this.fields[key].default() : undefined;
      }, {});

      return Object.keys(dft).length === 0 ? undefined : dft;
    }
  });

  this.fields = Object.create(null);
  this._nodes = [];
  this._excludedEdges = [];

  this.withMutation(function () {
    _this2.transform(function coerce(value) {
      if (typeof value === 'string') {
        try {
          value = JSON.parse(value);
        } catch (err) {
          value = null;
        }
      }
      if (this.isType(value)) return value;
      return null;
    });

    if (spec) {
      _this2.shape(spec);
    }
  });
}

(0, _inherits2.default)(ObjectSchema, _mixed2.default, {
  _typeCheck: function _typeCheck(value) {
    return isObject(value) || typeof value === 'function';
  },
  _cast: function _cast(_value) {
    var _this3 = this;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var value = _mixed2.default.prototype._cast.call(this, _value, options);

    //should ignore nulls here
    if (value === undefined) return this.default();

    if (!this._typeCheck(value)) return value;

    var fields = this.fields,
        strip = this._option('stripUnknown', options) === true,
        extra = Object.keys(value).filter(function (v) {
      return _this3._nodes.indexOf(v) === -1;
    }),
        props = this._nodes.concat(extra);

    var innerOptions = _extends({}, options, {
      parent: {}, // is filled during the transform below
      __validating: false
    });

    value = (0, _transform2.default)(props, function (obj, prop) {
      var field = fields[prop];
      var exists = (0, _has2.default)(value, prop);

      if (field) {
        var fieldValue = void 0;
        var strict = field._options && field._options.strict;

        // safe to mutate since this is fired in sequence
        innerOptions.path = (0, _makePath2.default)(_templateObject, options.path, prop);
        innerOptions.value = value[prop];

        field = field.resolve(innerOptions);

        if (field._strip === true) return;

        fieldValue = !options.__validating || !strict ? field.cast(value[prop], innerOptions) : value[prop];

        if (fieldValue !== undefined) obj[prop] = fieldValue;
      } else if (exists && !strip) obj[prop] = value[prop];
    }, innerOptions.parent);

    return value;
  },
  _validate: function _validate(_value) {
    var _this4 = this;

    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var endEarly = void 0,
        recursive = void 0;
    var errors = [];
    var originalValue = opts.originalValue != null ? opts.originalValue : _value;

    endEarly = this._option('abortEarly', opts);
    recursive = this._option('recursive', opts);

    opts = _extends({}, opts, { __validating: true, originalValue: originalValue });

    return _mixed2.default.prototype._validate.call(this, _value, opts).catch((0, _runValidations.propagateErrors)(endEarly, errors)).then(function (value) {
      if (!recursive || !isObject(value)) {
        // only iterate though actual objects
        if (errors.length) throw errors[0];
        return value;
      }

      originalValue = originalValue || value;

      var validations = _this4._nodes.map(function (key) {
        var path = (0, _makePath2.default)(_templateObject, opts.path, key);
        var field = _this4.fields[key];

        var innerOptions = _extends({}, opts, {
          path: path,
          parent: value,
          originalValue: originalValue[key]
        });

        if (field) {
          // inner fields are always strict:
          // 1. this isn't strict so the casting will also have cast inner values
          // 2. this is strict in which case the nested values weren't cast either
          innerOptions.strict = true;

          if (field.validate) return field.validate(value[key], innerOptions);
        }

        return true;
      });

      return (0, _runValidations2.default)({
        validations: validations,
        value: value,
        errors: errors,
        endEarly: endEarly,
        path: opts.path,
        sort: (0, _sortByKeyOrder2.default)(_this4.fields)
      });
    });
  },
  concat: function concat(schema) {
    var next = _mixed2.default.prototype.concat.call(this, schema);

    next._nodes = (0, _sortFields2.default)(next.fields, next._excludedEdges);

    return next;
  },
  shape: function shape(schema) {
    var excludes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

    var next = this.clone(),
        fields = _extends(next.fields, schema);

    if (!Array.isArray(excludes[0])) excludes = [excludes];

    next.fields = fields;

    if (excludes.length) {
      var keys = excludes.map(function (_ref) {
        var first = _ref[0],
            second = _ref[1];
        return first + '-' + second;
      });

      next._excludedEdges = next._excludedEdges.concat(keys);
    }

    next._nodes = (0, _sortFields2.default)(fields, next._excludedEdges);

    return next;
  },
  from: function from(_from, to, alias) {
    var fromGetter = (0, _propertyExpr.getter)(_from, true);

    return this.transform(function (obj) {
      var newObj = obj;

      if (obj == null) return obj;

      if ((0, _has2.default)(obj, _from)) {
        newObj = alias ? _extends({}, obj) : (0, _omit2.default)(obj, _from);
        newObj[to] = fromGetter(obj);
      }

      return newObj;
    });
  },
  noUnknown: function noUnknown() {
    var noAllow = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
    var message = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _locale.object.noUnknown;

    if (typeof noAllow === 'string') {
      message = noAllow;
      noAllow = true;
    }

    var next = this.test({
      name: 'noUnknown',
      exclusive: true,
      message: message,
      test: function test(value) {
        return value == null || !noAllow || unknown(this.schema, value).length === 0;
      }
    });

    if (noAllow) next._options.stripUnknown = true;

    return next;
  },
  transformKeys: function transformKeys(fn) {
    return this.transform(function (obj) {
      return obj && (0, _mapKeys2.default)(obj, function (_, key) {
        return fn(key);
      });
    });
  },
  camelCase: function camelCase() {
    return this.transformKeys(_camelCase3.default);
  },
  snakeCase: function snakeCase() {
    return this.transformKeys(_snakeCase3.default);
  },
  constantCase: function constantCase() {
    return this.transformKeys(function (key) {
      return (0, _snakeCase3.default)(key).toUpperCase();
    });
  }
});
module.exports = exports['default'];