'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault(ex) {
  return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex;
}

var has = _interopDefault(require('lodash/has'));
var synchronousPromise = require('synchronous-promise');
var propertyExpr = require('property-expr');
var mapValues = _interopDefault(require('lodash/mapValues'));
var cloneDeepWith = _interopDefault(require('lodash/cloneDeepWith'));
var _toArray = _interopDefault(require('lodash/toArray'));
var toposort = _interopDefault(require('toposort'));
var _snakeCase = _interopDefault(require('lodash/snakeCase'));
var _camelCase = _interopDefault(require('lodash/camelCase'));
var mapKeys = _interopDefault(require('lodash/mapKeys'));

function _extends() {
  _extends =
    Object.assign ||
    function(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };

  return _extends.apply(this, arguments);
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

function _taggedTemplateLiteralLoose(strings, raw) {
  if (!raw) {
    raw = strings.slice(0);
  }

  strings.raw = raw;
  return strings;
}

var toString = Object.prototype.toString;
var errorToString = Error.prototype.toString;
var regExpToString = RegExp.prototype.toString;
var symbolToString =
  typeof Symbol !== 'undefined'
    ? Symbol.prototype.toString
    : function() {
        return '';
      };
var SYMBOL_REGEXP = /^Symbol\((.*)\)(.*)$/;

function printNumber(val) {
  if (val != +val) return 'NaN';
  var isNegativeZero = val === 0 && 1 / val < 0;
  return isNegativeZero ? '-0' : '' + val;
}

function printSimpleValue(val, quoteStrings) {
  if (quoteStrings === void 0) {
    quoteStrings = false;
  }

  if (val == null || val === true || val === false) return '' + val;
  var typeOf = typeof val;
  if (typeOf === 'number') return printNumber(val);
  if (typeOf === 'string') return quoteStrings ? '"' + val + '"' : val;
  if (typeOf === 'function')
    return '[Function ' + (val.name || 'anonymous') + ']';
  if (typeOf === 'symbol')
    return symbolToString.call(val).replace(SYMBOL_REGEXP, 'Symbol($1)');
  var tag = toString.call(val).slice(8, -1);
  if (tag === 'Date')
    return isNaN(val.getTime()) ? '' + val : val.toISOString(val);
  if (tag === 'Error' || val instanceof Error)
    return '[' + errorToString.call(val) + ']';
  if (tag === 'RegExp') return regExpToString.call(val);
  return null;
}

function printValue(value, quoteStrings) {
  var result = printSimpleValue(value, quoteStrings);
  if (result !== null) return result;
  return JSON.stringify(
    value,
    function(key, value) {
      var result = printSimpleValue(this[key], quoteStrings);
      if (result !== null) return result;
      return value;
    },
    2,
  );
}

var mixed = {
  default: '${path} is invalid',
  required: '${path} is a required field',
  oneOf: '${path} must be one of the following values: ${values}',
  notOneOf: '${path} must not be one of the following values: ${values}',
  notType: function notType(_ref) {
    var path = _ref.path,
      type = _ref.type,
      value = _ref.value,
      originalValue = _ref.originalValue;
    var isCast = originalValue != null && originalValue !== value;
    var msg =
      path +
      ' must be a `' +
      type +
      '` type, ' +
      ('but the final value was: `' + printValue(value, true) + '`') +
      (isCast
        ? ' (cast from the value `' + printValue(originalValue, true) + '`).'
        : '.');

    if (value === null) {
      msg +=
        '\n If "null" is intended as an empty value be sure to mark the schema as `.nullable()`';
    }

    return msg;
  },
};
var string = {
  length: '${path} must be exactly ${length} characters',
  min: '${path} must be at least ${min} characters',
  max: '${path} must be at most ${max} characters',
  matches: '${path} must match the following: "${regex}"',
  email: '${path} must be a valid email',
  url: '${path} must be a valid URL',
  trim: '${path} must be a trimmed string',
  lowercase: '${path} must be a lowercase string',
  uppercase: '${path} must be a upper case string',
};
var number = {
  min: '${path} must be greater than or equal to ${min}',
  max: '${path} must be less than or equal to ${max}',
  lessThan: '${path} must be less than ${less}',
  moreThan: '${path} must be greater than ${more}',
  notEqual: '${path} must be not equal to ${notEqual}',
  positive: '${path} must be a positive number',
  negative: '${path} must be a negative number',
  integer: '${path} must be an integer',
};
var date = {
  min: '${path} field must be later than ${min}',
  max: '${path} field must be at earlier than ${max}',
};
var boolean = {};
var object = {
  noUnknown: '${path} field cannot have keys not specified in the object shape',
};
var array = {
  min: '${path} field must have at least ${min} items',
  max: '${path} field must have less than or equal to ${max} items',
};
var locale = {
  mixed: mixed,
  string: string,
  number: number,
  date: date,
  object: object,
  array: array,
  boolean: boolean,
};

var isSchema = function(obj) {
  return obj && obj.__isYupSchema__;
};

function callOrConcat(schema) {
  if (typeof schema === 'function') return schema;
  return function(base) {
    return base.concat(schema);
  };
}

var Conditional =
  /*#__PURE__*/
  (function() {
    function Conditional(refs, options) {
      var is = options.is,
        then = options.then,
        otherwise = options.otherwise;
      this.refs = [].concat(refs);
      then = callOrConcat(then);
      otherwise = callOrConcat(otherwise);
      if (typeof options === 'function') this.fn = options;
      else {
        if (!has(options, 'is'))
          throw new TypeError('`is:` is required for `when()` conditions');
        if (!options.then && !options.otherwise)
          throw new TypeError(
            'either `then:` or `otherwise:` is required for `when()` conditions',
          );
        var isFn =
          typeof is === 'function'
            ? is
            : function() {
                for (
                  var _len = arguments.length,
                    values = new Array(_len),
                    _key = 0;
                  _key < _len;
                  _key++
                ) {
                  values[_key] = arguments[_key];
                }

                return values.every(function(value) {
                  return value === is;
                });
              };

        this.fn = function() {
          for (
            var _len2 = arguments.length, values = new Array(_len2), _key2 = 0;
            _key2 < _len2;
            _key2++
          ) {
            values[_key2] = arguments[_key2];
          }

          var currentSchema = values.pop();
          var option = isFn.apply(void 0, values) ? then : otherwise;
          return option(currentSchema);
        };
      }
    }

    var _proto = Conditional.prototype;

    _proto.getValue = function getValue(parent, context) {
      var values = this.refs.map(function(r) {
        return r.getValue(parent, context);
      });
      return values;
    };

    _proto.resolve = function resolve(ctx, values) {
      var schema = this.fn.apply(ctx, values.concat(ctx));
      if (schema !== undefined && !isSchema(schema))
        throw new TypeError('conditions must return a schema object');
      return schema || ctx;
    };

    return Conditional;
  })();

var strReg = /\$\{\s*(\w+)\s*\}/g;

var replace = function replace(str) {
  return function(params) {
    return str.replace(strReg, function(_, key) {
      return printValue(params[key]);
    });
  };
};

function ValidationError(errors, value, field, type) {
  var _this = this;

  this.name = 'ValidationError';
  this.value = value;
  this.path = field;
  this.type = type;
  this.errors = [];
  this.inner = [];
  if (errors)
    [].concat(errors).forEach(function(err) {
      _this.errors = _this.errors.concat(err.errors || err);
      if (err.inner)
        _this.inner = _this.inner.concat(err.inner.length ? err.inner : err);
    });
  this.message =
    this.errors.length > 1
      ? this.errors.length + ' errors occurred'
      : this.errors[0];
  if (Error.captureStackTrace) Error.captureStackTrace(this, ValidationError);
}
ValidationError.prototype = Object.create(Error.prototype);
ValidationError.prototype.constructor = ValidationError;

ValidationError.isError = function(err) {
  return err && err.name === 'ValidationError';
};

ValidationError.formatError = function(message, params) {
  if (typeof message === 'string') message = replace(message);

  var fn = function fn(params) {
    params.path = params.label || params.path || 'this';
    return typeof message === 'function' ? message(params) : message;
  };

  return arguments.length === 1 ? fn : fn(params);
};

var promise = function promise(sync) {
  return sync ? synchronousPromise.SynchronousPromise : Promise;
};

var unwrapError = function unwrapError(errors) {
  if (errors === void 0) {
    errors = [];
  }

  return errors.inner && errors.inner.length ? errors.inner : [].concat(errors);
};

function scopeToValue(promises, value, sync) {
  //console.log('scopeToValue', promises, value)
  var p = promise(sync).all(promises); //console.log('scopeToValue B', p)

  var b = p.catch(function(err) {
    if (err.name === 'ValidationError') err.value = value;
    throw err;
  }); //console.log('scopeToValue c', b)

  var c = b.then(function() {
    return value;
  }); //console.log('scopeToValue d', c)

  return c;
}
/**
 * If not failing on the first error, catch the errors
 * and collect them in an array
 */

function propagateErrors(endEarly, errors) {
  return endEarly
    ? null
    : function(err) {
        errors.push(err);
        return err.value;
      };
}
function settled(promises, sync) {
  var settle = function settle(promise) {
    return promise.then(
      function(value) {
        return {
          fulfilled: true,
          value: value,
        };
      },
      function(value) {
        return {
          fulfilled: false,
          value: value,
        };
      },
    );
  };

  return promise(sync).all(promises.map(settle));
}
function collectErrors(_ref) {
  var validations = _ref.validations,
    value = _ref.value,
    path = _ref.path,
    sync = _ref.sync,
    errors = _ref.errors,
    sort = _ref.sort;
  errors = unwrapError(errors);
  return settled(validations, sync).then(function(results) {
    var nestedErrors = results
      .filter(function(r) {
        return !r.fulfilled;
      })
      .reduce(function(arr, _ref2) {
        var error = _ref2.value;

        // we are only collecting validation errors
        if (!ValidationError.isError(error)) {
          throw error;
        }

        return arr.concat(error);
      }, []);
    if (sort) nestedErrors.sort(sort); //show parent errors after the nested ones: name.first, name

    errors = nestedErrors.concat(errors);
    if (errors.length) throw new ValidationError(errors, value, path);
    return value;
  });
}
function runValidations(_ref3) {
  var endEarly = _ref3.endEarly,
    options = _objectWithoutPropertiesLoose(_ref3, ['endEarly']);

  if (endEarly)
    return scopeToValue(options.validations, options.value, options.sync);
  return collectErrors(options);
}

var isObject = function isObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
};

function merge(target, source) {
  for (var key in source) {
    if (has(source, key)) {
      var targetVal = target[key],
        sourceVal = source[key];
      if (sourceVal === undefined) continue;

      if (isSchema(sourceVal)) {
        target[key] = isSchema(targetVal)
          ? targetVal.concat(sourceVal)
          : sourceVal;
      } else if (isObject(sourceVal)) {
        target[key] = isObject(targetVal)
          ? merge(targetVal, sourceVal)
          : sourceVal;
      } else if (Array.isArray(sourceVal)) {
        target[key] = Array.isArray(targetVal)
          ? targetVal.concat(sourceVal)
          : sourceVal;
      } else target[key] = source[key];
    }
  }

  return target;
}

var isAbsent = function(value) {
  return value == null;
};

var validateName = function validateName(d) {
  if (typeof d !== 'string')
    throw new TypeError("ref's must be strings, got: " + d);
};

var Reference =
  /*#__PURE__*/
  (function() {
    Reference.isRef = function isRef(value) {
      return !!(value && (value.__isYupRef || value instanceof Reference));
    };

    var _proto = Reference.prototype;

    _proto.toString = function toString() {
      return 'Ref(' + this.key + ')';
    };

    function Reference(key, mapFn, options) {
      if (options === void 0) {
        options = {};
      }

      validateName(key);
      var prefix = options.contextPrefix || '$';

      if (typeof key === 'function') {
        key = '.';
      }

      this.key = key.trim();
      this.prefix = prefix;
      this.isContext = this.key.indexOf(prefix) === 0;
      this.isSelf = this.key === '.';
      this.path = this.isContext
        ? this.key.slice(this.prefix.length)
        : this.key;
      this._get = propertyExpr.getter(this.path, true);

      this.map =
        mapFn ||
        function(value) {
          return value;
        };
    }

    _proto.resolve = function resolve() {
      return this;
    };

    _proto.cast = function cast(value, _ref) {
      var parent = _ref.parent,
        context = _ref.context;
      return this.getValue(parent, context);
    };

    _proto.getValue = function getValue(parent, context) {
      var isContext = this.isContext;

      var value = this._get(isContext ? context : parent || context || {});

      return this.map(value);
    };

    return Reference;
  })();
Reference.prototype.__isYupRef = true;

var formatError = ValidationError.formatError;

var thenable = function thenable(p) {
  return p && typeof p.then === 'function' && typeof p.catch === 'function';
};

function runTest(testFn, ctx, value, sync) {
  var result = testFn.call(ctx, value);
  if (!sync) return Promise.resolve(result);

  if (thenable(result)) {
    throw new Error(
      'Validation test of type: "' +
        ctx.type +
        '" returned a Promise during a synchronous validate. ' +
        'This test will finish after the validate call has returned',
    );
  }

  return synchronousPromise.SynchronousPromise.resolve(result);
}

function resolveParams(oldParams, newParams, resolve) {
  return mapValues(_extends({}, oldParams, newParams), resolve);
}

function createErrorFactory(_ref) {
  var value = _ref.value,
    label = _ref.label,
    resolve = _ref.resolve,
    originalValue = _ref.originalValue,
    opts = _objectWithoutPropertiesLoose(_ref, [
      'value',
      'label',
      'resolve',
      'originalValue',
    ]);

  return function createError(_temp) {
    var _ref2 = _temp === void 0 ? {} : _temp,
      _ref2$path = _ref2.path,
      path = _ref2$path === void 0 ? opts.path : _ref2$path,
      _ref2$message = _ref2.message,
      message = _ref2$message === void 0 ? opts.message : _ref2$message,
      _ref2$type = _ref2.type,
      type = _ref2$type === void 0 ? opts.name : _ref2$type,
      params = _ref2.params;

    params = _extends(
      {
        path: path,
        value: value,
        originalValue: originalValue,
        label: label,
      },
      resolveParams(opts.params, params, resolve),
    );
    return _extends(
      new ValidationError(formatError(message, params), value, path, type),
      {
        params: params,
      },
    );
  };
}

function createValidation(options) {
  var name = options.name,
    message = options.message,
    test = options.test,
    params = options.params;

  function validate(_ref3) {
    var value = _ref3.value,
      path = _ref3.path,
      label = _ref3.label,
      options = _ref3.options,
      originalValue = _ref3.originalValue,
      sync = _ref3.sync,
      rest = _objectWithoutPropertiesLoose(_ref3, [
        'value',
        'path',
        'label',
        'options',
        'originalValue',
        'sync',
      ]);

    var parent = options.parent;

    var resolve = function resolve(value) {
      return Reference.isRef(value)
        ? value.getValue(parent, options.context)
        : value;
    };

    var createError = createErrorFactory({
      message: message,
      path: path,
      value: value,
      originalValue: originalValue,
      params: params,
      label: label,
      resolve: resolve,
      name: name,
    });

    var ctx = _extends(
      {
        path: path,
        parent: parent,
        type: name,
        createError: createError,
        resolve: resolve,
        options: options,
      },
      rest,
    );

    return runTest(test, ctx, value, sync).then(function(validOrError) {
      if (ValidationError.isError(validOrError)) throw validOrError;
      else if (!validOrError) throw createError();
    });
  }

  validate.TEST_NAME = name;
  validate.TEST_FN = test;
  validate.TEST = options;
  return validate;
}
module.exports.createErrorFactory = createErrorFactory;

var trim = function trim(part) {
  return part.substr(0, part.length - 1).substr(1);
};

function reach(obj, path, value, context) {
  var parent, lastPart; // if only one "value" arg then use it for both

  context = context || value;
  propertyExpr.forEach(path, function(_part, isBracket, isArray) {
    var part = isBracket ? trim(_part) : _part;

    if (isArray || has(obj, '_subType')) {
      // we skipped an array: foo[].bar
      var idx = isArray ? parseInt(part, 10) : 0;
      obj = obj.resolve({
        context: context,
        parent: parent,
        value: value,
      })._subType;

      if (value) {
        if (isArray && idx >= value.length) {
          throw new Error(
            'Yup.reach cannot resolve an array item at index: ' +
              _part +
              ', in the path: ' +
              path +
              '. ' +
              'because there is no value at that index. ',
          );
        }

        value = value[idx];
      }
    }

    if (!isArray) {
      obj = obj.resolve({
        context: context,
        parent: parent,
        value: value,
      });
      if (!has(obj, 'fields') || !has(obj.fields, part))
        throw new Error(
          'The schema does not contain the path: ' +
            path +
            '. ' +
            ('(failed at: ' +
              lastPart +
              ' which is a type: "' +
              obj._type +
              '") '),
        );
      obj = obj.fields[part];
      parent = value;
      value = value && value[part];
      lastPart = isBracket ? '[' + _part + ']' : '.' + _part;
    }
  });

  if (obj) {
    obj = obj.resolve({
      context: context,
      parent: parent,
      value: value,
    });
  }

  return obj;
}

var notEmpty = function notEmpty(value) {
  return !isAbsent(value);
};

var RefSet =
  /*#__PURE__*/
  (function() {
    function RefSet() {
      this.list = new Set();
      this.refs = new Map();
    }

    var _proto = RefSet.prototype;

    _proto.toArray = function toArray() {
      return _toArray(this.list).concat(_toArray(this.refs.values()));
    };

    _proto.add = function add(value) {
      Reference.isRef(value)
        ? this.refs.set(value.key, value)
        : this.list.add(value);
    };

    _proto.delete = function _delete(value) {
      Reference.isRef(value)
        ? this.refs.delete(value.key, value)
        : this.list.delete(value);
    };

    _proto.has = function has$$1(value, resolve) {
      if (this.list.has(value)) return true;
      var item,
        values = this.refs.values();

      while (((item = values.next()), !item.done)) {
        if (resolve(item.value) === value) return true;
      }

      return false;
    };

    return RefSet;
  })();

function SchemaType(options) {
  var _this = this;

  if (options === void 0) {
    options = {};
  }

  if (!(this instanceof SchemaType)) return new SchemaType();
  this._deps = [];
  this._conditions = [];
  this._options = {
    abortEarly: true,
    recursive: true,
  };
  this._exclusive = Object.create(null);
  this._whitelist = new RefSet();
  this._blacklist = new RefSet();
  this.tests = [];
  this.transforms = [];
  this.withMutation(function() {
    _this.typeError(mixed.notType);
  });
  if (has(options, 'default')) this._defaultDefault = options.default;
  this._type = options.type || 'mixed';
}
SchemaType.prototype = {
  __isYupSchema__: true,
  constructor: SchemaType,
  reach: function reach$$1(path, value, context) {
    return reach(this, path, value, context);
  },
  clone: function clone() {
    var _this2 = this;

    if (this._mutate) return this; // if the nested value is a schema we can skip cloning, since
    // they are already immutable

    return cloneDeepWith(this, function(value) {
      if (isSchema(value) && value !== _this2) return value;
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
    if (schema._type !== this._type && this._type !== 'mixed')
      throw new TypeError(
        "You cannot `concat()` schema's of different types: " +
          this._type +
          ' and ' +
          schema._type,
      );
    var cloned = this.clone();
    var next = merge(this.clone(), schema.clone()); // undefined isn't merged over, but is a valid value for default

    if (has(schema, '_default')) next._default = schema._default;
    next.tests = cloned.tests;
    next._exclusive = cloned._exclusive; // manually add the new tests to ensure
    // the deduping logic is consistent

    schema.tests.forEach(function(fn) {
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
      return this._conditions.reduce(function(schema, match) {
        return match.resolve(schema, match.getValue(parent, context));
      }, this);
    }

    return this;
  },
  cast: function cast(value, options) {
    if (options === void 0) {
      options = {};
    }

    var resolvedSchema = this.resolve(options);

    var result = resolvedSchema._cast(value, options);

    if (
      value !== undefined &&
      options.assert !== false &&
      resolvedSchema.isType(result) !== true
    ) {
      var formattedValue = printValue(value);
      var formattedResult = printValue(result);
      throw new TypeError(
        'The value of ' +
          (options.path || 'field') +
          ' could not be cast to a value ' +
          ('that satisfies the schema type: "' +
            resolvedSchema._type +
            '". \n\n') +
          ('attempted value: ' + formattedValue + ' \n') +
          (formattedResult !== formattedValue
            ? 'result of cast: ' + formattedResult
            : ''),
      );
    }

    return result;
  },
  _cast: function _cast(rawValue) {
    var _this3 = this;

    var value =
      rawValue === undefined
        ? rawValue
        : this.transforms.reduce(function(value, fn) {
            return fn.call(_this3, value, rawValue);
          }, rawValue);

    if (value === undefined && has(this, '_default')) {
      value = this.default();
    }

    return value;
  },
  _validate: function _validate(_value, options) {
    var _this4 = this;

    if (options === void 0) {
      options = {};
    }

    var value = _value;
    var originalValue =
      options.originalValue != null ? options.originalValue : _value;

    var isStrict = this._option('strict', options);

    var endEarly = this._option('abortEarly', options);

    var sync = options.sync;
    var path = options.path;
    var label = this._label;

    if (!isStrict) {
      value = this._cast(
        value,
        _extends(
          {
            assert: false,
          },
          options,
        ),
      );
    } // value is cast, we can check if it meets type requirements

    var validationParams = {
      value: value,
      path: path,
      schema: this,
      options: options,
      label: label,
      originalValue: originalValue,
      sync: sync,
    };
    var initialTests = [];
    if (this._typeError) initialTests.push(this._typeError(validationParams));
    if (this._whitelistError)
      initialTests.push(this._whitelistError(validationParams));
    if (this._blacklistError)
      initialTests.push(this._blacklistError(validationParams));
    return runValidations({
      validations: initialTests,
      endEarly: endEarly,
      value: value,
      path: path,
      sync: sync,
    }).then(function(value) {
      return runValidations({
        path: path,
        sync: sync,
        value: value,
        endEarly: endEarly,
        validations: _this4.tests.map(function(fn) {
          return fn(validationParams);
        }),
      });
    });
  },
  validate: function validate(value, options) {
    if (options === void 0) {
      options = {};
    }

    var schema = this.resolve(options);
    return schema._validate(value, options);
  },
  validateSync: function validateSync(value, options) {
    if (options === void 0) {
      options = {};
    }

    var schema = this.resolve(options);
    var result, err;

    schema
      ._validate(
        value,
        _extends({}, options, {
          sync: true,
        }),
      )
      .then(function(r) {
        return (result = r);
      })
      .catch(function(e) {
        return (err = e);
      });

    if (err) throw err;
    return result;
  },
  isValid: function isValid(value, options) {
    return this.validate(value, options)
      .then(function() {
        return true;
      })
      .catch(function(err) {
        if (err.name === 'ValidationError') return false;
        throw err;
      });
  },
  isValidSync: function isValidSync(value, options) {
    try {
      this.validateSync(value, _extends({}, options));
      return true;
    } catch (err) {
      if (err.name === 'ValidationError') return false;
      throw err;
    }
  },
  getDefault: function getDefault(options) {
    if (options === void 0) {
      options = {};
    }

    var schema = this.resolve(options);
    return schema.default();
  },
  default: function _default(def) {
    if (arguments.length === 0) {
      var defaultValue = has(this, '_default')
        ? this._default
        : this._defaultDefault;
      return typeof defaultValue === 'function'
        ? defaultValue.call(this)
        : cloneDeepWith(defaultValue);
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
  required: function required(message) {
    if (message === void 0) {
      message = mixed.required;
    }

    return this.test({
      message: message,
      name: 'required',
      test: notEmpty,
    });
  },
  notRequired: function notRequired() {
    var next = this.clone();
    next.tests = next.tests.filter(function(test) {
      return test.TEST_NAME !== 'required';
    });
    return next;
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
  test: function test() {
    for (
      var _len = arguments.length, args = new Array(_len), _key = 0;
      _key < _len;
      _key++
    ) {
      args[_key] = arguments[_key];
    }

    var opts = args[0];

    if (args.length > 1) {
      var name = args[0],
        message = args[1],
        test = args[2];

      if (test == null) {
        test = message;
        message = mixed.default;
      }

      opts = {
        name: name,
        test: test,
        message: message,
        exclusive: false,
      };
    }

    if (typeof opts.test !== 'function')
      throw new TypeError('`test` is a required parameters');
    var next = this.clone();
    var validate = createValidation(opts);
    var isExclusive =
      opts.exclusive || (opts.name && next._exclusive[opts.name] === true);

    if (opts.exclusive && !opts.name) {
      throw new TypeError(
        'Exclusive tests must provide a unique `name` identifying the test',
      );
    }

    next._exclusive[opts.name] = !!opts.exclusive;
    next.tests = next.tests.filter(function(fn) {
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
      deps = [].concat(keys).map(function(key) {
        return new Reference(key);
      });
    deps.forEach(function(dep) {
      if (!dep.isContext) next._deps.push(dep.key);
    });

    next._conditions.push(new Conditional(deps, options));

    return next;
  },
  typeError: function typeError(message) {
    var next = this.clone();
    next._typeError = createValidation({
      message: message,
      name: 'typeError',
      test: function test(value) {
        if (value !== undefined && !this.schema.isType(value))
          return this.createError({
            params: {
              type: this.schema._type,
            },
          });
        return true;
      },
    });
    return next;
  },
  oneOf: function oneOf(enums, message) {
    if (message === void 0) {
      message = mixed.oneOf;
    }

    var next = this.clone();
    enums.forEach(function(val) {
      next._whitelist.add(val);

      next._blacklist.delete(val);
    });
    next._whitelistError = createValidation({
      message: message,
      name: 'oneOf',
      test: function test(value) {
        if (value === undefined) return true;
        var valids = this.schema._whitelist;
        return valids.has(value, this.resolve)
          ? true
          : this.createError({
              params: {
                values: valids.toArray().join(', '),
              },
            });
      },
    });
    return next;
  },
  notOneOf: function notOneOf(enums, message) {
    if (message === void 0) {
      message = mixed.notOneOf;
    }

    var next = this.clone();
    enums.forEach(function(val) {
      next._blacklist.add(val);

      next._whitelist.delete(val);
    });
    next._blacklistError = createValidation({
      message: message,
      name: 'notOneOf',
      test: function test(value) {
        var invalids = this.schema._blacklist;
        if (invalids.has(value, this.resolve))
          return this.createError({
            params: {
              values: invalids.toArray().join(', '),
            },
          });
        return true;
      },
    });
    return next;
  },
  strip: function strip(_strip) {
    if (_strip === void 0) {
      _strip = true;
    }

    var next = this.clone();
    next._strip = _strip;
    return next;
  },
  _option: function _option(key, overrides) {
    return has(overrides, key) ? overrides[key] : this._options[key];
  },
  describe: function describe() {
    var next = this.clone();
    return {
      type: next._type,
      meta: next._meta,
      label: next._label,
      tests: next.tests
        .map(function(fn) {
          return fn.TEST_NAME;
        }, {})
        .filter(function(n, idx, list) {
          return list.indexOf(n) === idx;
        }),
    };
  },
};
var aliases = {
  oneOf: ['equals', 'is'],
  notOneOf: ['not', 'nope'],
};
Object.keys(aliases).forEach(function(method) {
  aliases[method].forEach(function(alias) {
    return (SchemaType.prototype[alias] = SchemaType.prototype[method]);
  });
});

function inherits(ctor, superCtor, spec) {
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true,
    },
  });

  _extends(ctor.prototype, spec);
}

function BooleanSchema() {
  var _this = this;

  if (!(this instanceof BooleanSchema)) return new BooleanSchema();
  SchemaType.call(this, {
    type: 'boolean',
  });
  this.withMutation(function() {
    _this.transform(function(value) {
      if (!this.isType(value)) {
        if (/^(true|1)$/i.test(value)) return true;
        if (/^(false|0)$/i.test(value)) return false;
      }

      return value;
    });
  });
}

inherits(BooleanSchema, SchemaType, {
  _typeCheck: function _typeCheck(v) {
    if (v instanceof Boolean) v = v.valueOf();
    return typeof v === 'boolean';
  },
});

var rEmail = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i; // eslint-disable-next-line

var rUrl = /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;

var hasLength = function hasLength(value) {
  return isAbsent(value) || value.length > 0;
};

var isTrimmed = function isTrimmed(value) {
  return isAbsent(value) || value === value.trim();
};

function StringSchema() {
  var _this = this;

  if (!(this instanceof StringSchema)) return new StringSchema();
  SchemaType.call(this, {
    type: 'string',
  });
  this.withMutation(function() {
    _this.transform(function(value) {
      if (this.isType(value)) return value;
      return value != null && value.toString ? value.toString() : value;
    });
  });
}
inherits(StringSchema, SchemaType, {
  _typeCheck: function _typeCheck(value) {
    if (value instanceof String) value = value.valueOf();
    return typeof value === 'string';
  },
  required: function required(message) {
    if (message === void 0) {
      message = mixed.required;
    }

    var next = SchemaType.prototype.required.call(this, message);
    return next.test({
      message: message,
      name: 'required',
      test: hasLength,
    });
  },
  length: function length(_length, message) {
    if (message === void 0) {
      message = string.length;
    }

    return this.test({
      message: message,
      name: 'length',
      exclusive: true,
      params: {
        length: _length,
      },
      test: function test(value) {
        return isAbsent(value) || value.length === this.resolve(_length);
      },
    });
  },
  min: function min(_min, message) {
    if (message === void 0) {
      message = string.min;
    }

    return this.test({
      message: message,
      name: 'min',
      exclusive: true,
      params: {
        min: _min,
      },
      test: function test(value) {
        return isAbsent(value) || value.length >= this.resolve(_min);
      },
    });
  },
  max: function max(_max, message) {
    if (message === void 0) {
      message = string.max;
    }

    return this.test({
      name: 'max',
      exclusive: true,
      message: message,
      params: {
        max: _max,
      },
      test: function test(value) {
        return isAbsent(value) || value.length <= this.resolve(_max);
      },
    });
  },
  matches: function matches(regex, options) {
    var excludeEmptyString = false;
    var message;

    if (options) {
      if (options.message || options.hasOwnProperty('excludeEmptyString')) {
        excludeEmptyString = options.excludeEmptyString;
        message = options.message;
      } else message = options;
    }

    return this.test({
      message: message || string.matches,
      params: {
        regex: regex,
      },
      test: function test(value) {
        return (
          isAbsent(value) ||
          (value === '' && excludeEmptyString) ||
          regex.test(value)
        );
      },
    });
  },
  email: function email(message) {
    if (message === void 0) {
      message = string.email;
    }

    return this.matches(rEmail, {
      message: message,
      excludeEmptyString: true,
    });
  },
  url: function url(message) {
    if (message === void 0) {
      message = string.url;
    }

    return this.matches(rUrl, {
      message: message,
      excludeEmptyString: true,
    });
  },
  //-- transforms --
  ensure: function ensure() {
    return this.default('').transform(function(val) {
      return val === null ? '' : val;
    });
  },
  trim: function trim(message) {
    if (message === void 0) {
      message = string.trim;
    }

    return this.transform(function(val) {
      return val != null ? val.trim() : val;
    }).test({
      message: message,
      name: 'trim',
      test: isTrimmed,
    });
  },
  lowercase: function lowercase(message) {
    if (message === void 0) {
      message = string.lowercase;
    }

    return this.transform(function(value) {
      return !isAbsent(value) ? value.toLowerCase() : value;
    }).test({
      message: message,
      name: 'string_case',
      exclusive: true,
      test: function test(value) {
        return isAbsent(value) || value === value.toLowerCase();
      },
    });
  },
  uppercase: function uppercase(message) {
    if (message === void 0) {
      message = string.uppercase;
    }

    return this.transform(function(value) {
      return !isAbsent(value) ? value.toUpperCase() : value;
    }).test({
      message: message,
      name: 'string_case',
      exclusive: true,
      test: function test(value) {
        return isAbsent(value) || value === value.toUpperCase();
      },
    });
  },
});

var isNaN$1 = function isNaN(value) {
  return value != +value;
};

var isInteger = function isInteger(val) {
  return isAbsent(val) || val === (val | 0);
};

function NumberSchema() {
  var _this = this;

  if (!(this instanceof NumberSchema)) return new NumberSchema();
  SchemaType.call(this, {
    type: 'number',
  });
  this.withMutation(function() {
    _this.transform(function(value) {
      if (this.isType(value)) return value;
      var parsed = parseFloat(value);
      if (this.isType(parsed)) return parsed;
      return NaN;
    });
  });
}
inherits(NumberSchema, SchemaType, {
  _typeCheck: function _typeCheck(value) {
    if (value instanceof Number) value = value.valueOf();
    return typeof value === 'number' && !isNaN$1(value);
  },
  min: function min(_min, message) {
    if (message === void 0) {
      message = number.min;
    }

    return this.test({
      message: message,
      name: 'min',
      exclusive: true,
      params: {
        min: _min,
      },
      test: function test(value) {
        return isAbsent(value) || value >= this.resolve(_min);
      },
    });
  },
  max: function max(_max, message) {
    if (message === void 0) {
      message = number.max;
    }

    return this.test({
      message: message,
      name: 'max',
      exclusive: true,
      params: {
        max: _max,
      },
      test: function test(value) {
        return isAbsent(value) || value <= this.resolve(_max);
      },
    });
  },
  lessThan: function lessThan(less, message) {
    if (message === void 0) {
      message = number.lessThan;
    }

    return this.test({
      message: message,
      name: 'max',
      exclusive: true,
      params: {
        less: less,
      },
      test: function test(value) {
        return isAbsent(value) || value < this.resolve(less);
      },
    });
  },
  moreThan: function moreThan(more, message) {
    if (message === void 0) {
      message = number.moreThan;
    }

    return this.test({
      message: message,
      name: 'min',
      exclusive: true,
      params: {
        more: more,
      },
      test: function test(value) {
        return isAbsent(value) || value > this.resolve(more);
      },
    });
  },
  positive: function positive(msg) {
    if (msg === void 0) {
      msg = number.positive;
    }

    return this.min(0, msg);
  },
  negative: function negative(msg) {
    if (msg === void 0) {
      msg = number.negative;
    }

    return this.max(0, msg);
  },
  integer: function integer(message) {
    if (message === void 0) {
      message = number.integer;
    }

    return this.test({
      name: 'integer',
      message: message,
      test: isInteger,
    });
  },
  truncate: function truncate() {
    return this.transform(function(value) {
      return !isAbsent(value) ? value | 0 : value;
    });
  },
  round: function round(method) {
    var avail = ['ceil', 'floor', 'round', 'trunc'];
    method = (method && method.toLowerCase()) || 'round'; // this exists for symemtry with the new Math.trunc

    if (method === 'trunc') return this.truncate();
    if (avail.indexOf(method.toLowerCase()) === -1)
      throw new TypeError(
        'Only valid options for round() are: ' + avail.join(', '),
      );
    return this.transform(function(value) {
      return !isAbsent(value) ? Math[method](value) : value;
    });
  },
});

/* eslint-disable */

/**
 *
 * Date.parse with progressive enhancement for ISO 8601 <https://github.com/csnover/js-iso8601>
 * NON-CONFORMANT EDITION.
 * © 2011 Colin Snover <http://zetafleet.com>
 * Released under MIT license.
 */
//              1 YYYY                 2 MM        3 DD              4 HH     5 mm        6 ss            7 msec         8 Z 9 ±    10 tzHH    11 tzmm
var isoReg = /^(\d{4}|[+\-]\d{6})(?:-?(\d{2})(?:-?(\d{2}))?)?(?:[ T]?(\d{2}):?(\d{2})(?::?(\d{2})(?:[,\.](\d{1,}))?)?(?:(Z)|([+\-])(\d{2})(?::?(\d{2}))?)?)?$/;
function parseIsoDate(date) {
  var numericKeys = [1, 4, 5, 6, 7, 10, 11],
    minutesOffset = 0,
    timestamp,
    struct;

  if ((struct = isoReg.exec(date))) {
    // avoid NaN timestamps caused by “undefined” values being passed to Date.UTC
    for (var i = 0, k; (k = numericKeys[i]); ++i) {
      struct[k] = +struct[k] || 0;
    } // allow undefined days and months

    struct[2] = (+struct[2] || 1) - 1;
    struct[3] = +struct[3] || 1; // allow arbitrary sub-second precision beyond milliseconds

    struct[7] = struct[7] ? String(struct[7]).substr(0, 3) : 0; // timestamps without timezone identifiers should be considered local time

    if (
      (struct[8] === undefined || struct[8] === '') &&
      (struct[9] === undefined || struct[9] === '')
    )
      timestamp = +new Date(
        struct[1],
        struct[2],
        struct[3],
        struct[4],
        struct[5],
        struct[6],
        struct[7],
      );
    else {
      if (struct[8] !== 'Z' && struct[9] !== undefined) {
        minutesOffset = struct[10] * 60 + struct[11];
        if (struct[9] === '+') minutesOffset = 0 - minutesOffset;
      }

      timestamp = Date.UTC(
        struct[1],
        struct[2],
        struct[3],
        struct[4],
        struct[5] + minutesOffset,
        struct[6],
        struct[7],
      );
    }
  } else timestamp = Date.parse ? Date.parse(date) : NaN;

  return timestamp;
}

var invalidDate = new Date('');

var isDate = function isDate(obj) {
  return Object.prototype.toString.call(obj) === '[object Date]';
};

function DateSchema() {
  var _this = this;

  if (!(this instanceof DateSchema)) return new DateSchema();
  SchemaType.call(this, {
    type: 'date',
  });
  this.withMutation(function() {
    _this.transform(function(value) {
      if (this.isType(value)) return isDate(value) ? new Date(value) : value;
      value = parseIsoDate(value);
      return value ? new Date(value) : invalidDate;
    });
  });
}

inherits(DateSchema, SchemaType, {
  _typeCheck: function _typeCheck(v) {
    return isDate(v) && !isNaN(v.getTime());
  },
  min: function min(_min, message) {
    if (message === void 0) {
      message = date.min;
    }

    var limit = _min;

    if (!Reference.isRef(limit)) {
      limit = this.cast(_min);
      if (!this._typeCheck(limit))
        throw new TypeError(
          '`min` must be a Date or a value that can be `cast()` to a Date',
        );
    }

    return this.test({
      message: message,
      name: 'min',
      exclusive: true,
      params: {
        min: _min,
      },
      test: function test(value) {
        return isAbsent(value) || value >= this.resolve(limit);
      },
    });
  },
  max: function max(_max, message) {
    if (message === void 0) {
      message = date.max;
    }

    var limit = _max;

    if (!Reference.isRef(limit)) {
      limit = this.cast(_max);
      if (!this._typeCheck(limit))
        throw new TypeError(
          '`max` must be a Date or a value that can be `cast()` to a Date',
        );
    }

    return this.test({
      message: message,
      name: 'max',
      exclusive: true,
      params: {
        max: _max,
      },
      test: function test(value) {
        return isAbsent(value) || value <= this.resolve(limit);
      },
    });
  },
});

function sortFields(fields, excludes) {
  if (excludes === void 0) {
    excludes = [];
  }

  var edges = [],
    nodes = [];

  function addNode(depPath, key) {
    var node = propertyExpr.split(depPath)[0];
    if (!~nodes.indexOf(node)) nodes.push(node);
    if (!~excludes.indexOf(key + '-' + node)) edges.push([key, node]);
  }

  for (var key in fields) {
    if (has(fields, key)) {
      var value = fields[key];
      if (!~nodes.indexOf(key)) nodes.push(key);
      if (Reference.isRef(value) && !value.isContext) addNode(value.path, key);
      else if (isSchema(value) && value._deps)
        value._deps.forEach(function(path) {
          return addNode(path, key);
        });
    }
  }

  return toposort.array(nodes, edges).reverse();
}

function findIndex(arr, err) {
  var idx = Infinity;
  arr.some(function(key, ii) {
    if (err.path.indexOf(key) !== -1) {
      idx = ii;
      return true;
    }
  });
  return idx;
}

function sortByKeyOrder(fields) {
  var keys = Object.keys(fields);
  return function(a, b) {
    return findIndex(keys, a) - findIndex(keys, b);
  };
}

function makePath(strings) {
  for (
    var _len = arguments.length,
      values = new Array(_len > 1 ? _len - 1 : 0),
      _key = 1;
    _key < _len;
    _key++
  ) {
    values[_key - 1] = arguments[_key];
  }

  var path = strings.reduce(function(str, next) {
    var value = values.shift();
    return str + (value == null ? '' : value) + next;
  });
  return path.replace(/^\./, '');
}

function _templateObject2() {
  var data = _taggedTemplateLiteralLoose(['', '.', '']);

  _templateObject2 = function _templateObject2() {
    return data;
  };

  return data;
}

function _templateObject() {
  var data = _taggedTemplateLiteralLoose(['', '.', '']);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

var isObject$1 = function isObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
};

function unknown(ctx, value) {
  var known = Object.keys(ctx.fields);
  return Object.keys(value).filter(function(key) {
    return known.indexOf(key) === -1;
  });
}

function ObjectSchema(spec) {
  var _this2 = this;

  if (!(this instanceof ObjectSchema)) return new ObjectSchema(spec);
  SchemaType.call(this, {
    type: 'object',
    default: function _default() {
      var _this = this;

      if (!this._nodes.length) return undefined;
      var dft = {};

      this._nodes.forEach(function(key) {
        dft[key] = _this.fields[key].default
          ? _this.fields[key].default()
          : undefined;
      });

      return dft;
    },
  });
  this.fields = Object.create(null);
  this._nodes = [];
  this._excludedEdges = [];
  this.withMutation(function() {
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
inherits(ObjectSchema, SchemaType, {
  _typeCheck: function _typeCheck(value) {
    return isObject$1(value) || typeof value === 'function';
  },
  _cast: function _cast(_value, options) {
    var _this3 = this;

    if (options === void 0) {
      options = {};
    }

    var value = SchemaType.prototype._cast.call(this, _value, options); //should ignore nulls here

    if (value === undefined) return this.default();
    if (!this._typeCheck(value)) return value;
    var fields = this.fields;
    var strip = this._option('stripUnknown', options) === true;

    var props = this._nodes.concat(
      Object.keys(value).filter(function(v) {
        return _this3._nodes.indexOf(v) === -1;
      }),
    );

    var intermediateValue = {}; // is filled during the transform below

    var innerOptions = _extends({}, options, {
      parent: intermediateValue,
      __validating: false,
    });

    props.forEach(function(prop) {
      var field = fields[prop];
      var exists = has(value, prop);

      if (field) {
        var fieldValue;
        var strict = field._options && field._options.strict; // safe to mutate since this is fired in sequence

        innerOptions.path = makePath(_templateObject(), options.path, prop);
        innerOptions.value = value[prop];
        field = field.resolve(innerOptions);
        if (field._strip === true) return;
        fieldValue =
          !options.__validating || !strict
            ? field.cast(value[prop], innerOptions)
            : value[prop];
        if (fieldValue !== undefined) intermediateValue[prop] = fieldValue;
      } else if (exists && !strip) intermediateValue[prop] = value[prop];
    });
    return intermediateValue;
  },
  _validate: function _validate(_value, opts) {
    var _this4 = this;

    if (opts === void 0) {
      opts = {};
    }

    var endEarly, recursive;
    var sync = opts.sync;
    var errors = [];
    var originalValue =
      opts.originalValue != null ? opts.originalValue : _value;
    endEarly = this._option('abortEarly', opts);
    recursive = this._option('recursive', opts);
    opts = _extends({}, opts, {
      __validating: true,
      originalValue: originalValue,
    });
    return SchemaType.prototype._validate
      .call(this, _value, opts)
      .catch(propagateErrors(endEarly, errors))
      .then(function(value) {
        if (!recursive || !isObject$1(value)) {
          // only iterate though actual objects
          if (errors.length) throw errors[0];
          return value;
        }

        originalValue = originalValue || value;

        var validations = _this4._nodes.map(function(key) {
          var path = makePath(_templateObject2(), opts.path, key);
          var field = _this4.fields[key];

          var innerOptions = _extends({}, opts, {
            path: path,
            parent: value,
            originalValue: originalValue[key],
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

        return runValidations({
          sync: sync,
          validations: validations,
          value: value,
          errors: errors,
          endEarly: endEarly,
          path: opts.path,
          sort: sortByKeyOrder(_this4.fields),
        });
      });
  },
  concat: function concat(schema) {
    var next = SchemaType.prototype.concat.call(this, schema);
    next._nodes = sortFields(next.fields, next._excludedEdges);
    return next;
  },
  shape: function shape(schema, excludes) {
    if (excludes === void 0) {
      excludes = [];
    }

    var next = this.clone(),
      fields = _extends(next.fields, schema);

    next.fields = fields;

    if (excludes.length) {
      if (!Array.isArray(excludes[0])) excludes = [excludes];
      var keys = excludes.map(function(_ref) {
        var first = _ref[0],
          second = _ref[1];
        return first + '-' + second;
      });
      next._excludedEdges = next._excludedEdges.concat(keys);
    }

    next._nodes = sortFields(fields, next._excludedEdges);
    return next;
  },
  from: function from(_from, to, alias) {
    var fromGetter = propertyExpr.getter(_from, true);
    return this.transform(function(obj) {
      var newObj = obj;
      if (obj == null) return obj;

      if (has(obj, _from)) {
        newObj = _extends({}, obj);
        if (!alias) delete obj[_from];
        newObj[to] = fromGetter(obj);
      }

      return newObj;
    });
  },
  noUnknown: function noUnknown(noAllow, message) {
    if (noAllow === void 0) {
      noAllow = true;
    }

    if (message === void 0) {
      message = object.noUnknown;
    }

    if (typeof noAllow === 'string') {
      message = noAllow;
      noAllow = true;
    }

    var next = this.test({
      name: 'noUnknown',
      exclusive: true,
      message: message,
      test: function test(value) {
        return (
          value == null || !noAllow || unknown(this.schema, value).length === 0
        );
      },
    });
    if (noAllow) next._options.stripUnknown = true;
    return next;
  },
  transformKeys: function transformKeys(fn) {
    return this.transform(function(obj) {
      return (
        obj &&
        mapKeys(obj, function(_, key) {
          return fn(key);
        })
      );
    });
  },
  camelCase: function camelCase() {
    return this.transformKeys(_camelCase);
  },
  snakeCase: function snakeCase() {
    return this.transformKeys(_snakeCase);
  },
  constantCase: function constantCase() {
    return this.transformKeys(function(key) {
      return _snakeCase(key).toUpperCase();
    });
  },
  describe: function describe() {
    var base = SchemaType.prototype.describe.call(this);
    base.fields = mapValues(this.fields, function(value) {
      return value.describe();
    });
    return base;
  },
});

function _templateObject$1() {
  var data = _taggedTemplateLiteralLoose(['', '[', ']']);

  _templateObject$1 = function _templateObject() {
    return data;
  };

  return data;
}

var hasLength$1 = function hasLength(value) {
  return !isAbsent(value) && value.length > 0;
};

function ArraySchema(type) {
  var _this = this;

  if (!(this instanceof ArraySchema)) return new ArraySchema(type);
  SchemaType.call(this, {
    type: 'array',
  }); // `undefined` specifically means uninitialized, as opposed to
  // "no subtype"

  this._subType = undefined;
  this.withMutation(function() {
    _this.transform(function(values) {
      if (typeof values === 'string')
        try {
          values = JSON.parse(values);
        } catch (err) {
          values = null;
        }
      return this.isType(values) ? values : null;
    });

    if (type) _this.of(type);
  });
}

inherits(ArraySchema, SchemaType, {
  _typeCheck: function _typeCheck(v) {
    return Array.isArray(v);
  },
  _cast: function _cast(_value, _opts) {
    var _this2 = this;

    var value = SchemaType.prototype._cast.call(this, _value, _opts); //should ignore nulls here

    if (!this._typeCheck(value) || !this._subType) return value;
    return value.map(function(v) {
      return _this2._subType.cast(v, _opts);
    });
  },
  _validate: function _validate(_value, options) {
    var _this3 = this;

    if (options === void 0) {
      options = {};
    }

    var errors = [];
    var sync = options.sync;
    var path = options.path;
    var subType = this._subType;

    var endEarly = this._option('abortEarly', options);

    var recursive = this._option('recursive', options);

    var originalValue =
      options.originalValue != null ? options.originalValue : _value;
    return SchemaType.prototype._validate
      .call(this, _value, options)
      .catch(propagateErrors(endEarly, errors))
      .then(function(value) {
        if (!recursive || !subType || !_this3._typeCheck(value)) {
          if (errors.length) throw errors[0];
          return value;
        }

        originalValue = originalValue || value;
        var validations = value.map(function(item, idx) {
          var path = makePath(_templateObject$1(), options.path, idx); // object._validate note for isStrict explanation

          var innerOptions = _extends({}, options, {
            path: path,
            strict: true,
            parent: value,
            originalValue: originalValue[idx],
          });

          if (subType.validate) return subType.validate(item, innerOptions);
          return true;
        });
        return runValidations({
          sync: sync,
          path: path,
          value: value,
          errors: errors,
          endEarly: endEarly,
          validations: validations,
        });
      });
  },
  of: function of(schema) {
    var next = this.clone();
    if (schema !== false && !isSchema(schema))
      throw new TypeError(
        '`array.of()` sub-schema must be a valid yup schema, or `false` to negate a current sub-schema. ' +
          'not: ' +
          printValue(schema),
      );
    next._subType = schema;
    return next;
  },
  required: function required(message) {
    if (message === void 0) {
      message = mixed.required;
    }

    var next = SchemaType.prototype.required.call(this, message);
    return next.test({
      message: message,
      name: 'required',
      test: hasLength$1,
    });
  },
  min: function min(_min, message) {
    message = message || array.min;
    return this.test({
      message: message,
      name: 'min',
      exclusive: true,
      params: {
        min: _min,
      },
      test: function test(value) {
        return isAbsent(value) || value.length >= this.resolve(_min);
      },
    });
  },
  max: function max(_max, message) {
    message = message || array.max;
    return this.test({
      message: message,
      name: 'max',
      exclusive: true,
      params: {
        max: _max,
      },
      test: function test(value) {
        return isAbsent(value) || value.length <= this.resolve(_max);
      },
    });
  },
  ensure: function ensure() {
    return this.default(function() {
      return [];
    }).transform(function(val) {
      return val === null ? [] : [].concat(val);
    });
  },
  compact: function compact(rejector) {
    var reject = !rejector
      ? function(v) {
          return !!v;
        }
      : function(v, i, a) {
          return !rejector(v, i, a);
        };
    return this.transform(function(values) {
      return values != null ? values.filter(reject) : values;
    });
  },
  describe: function describe() {
    var base = SchemaType.prototype.describe.call(this);
    if (this._subType) base.innerType = this._subType.describe();
    return base;
  },
});

var Lazy =
  /*#__PURE__*/
  (function() {
    function Lazy(mapFn) {
      this._resolve = function() {
        var schema = mapFn.apply(void 0, arguments);
        if (!isSchema(schema))
          throw new TypeError('lazy() functions must return a valid schema');
        return schema;
      };
    }

    var _proto = Lazy.prototype;

    _proto.resolve = function resolve(_ref) {
      var value = _ref.value,
        rest = _objectWithoutPropertiesLoose(_ref, ['value']);

      return this._resolve(value, rest);
    };

    _proto.cast = function cast(value, options) {
      return this._resolve(value, options).cast(value, options);
    };

    _proto.validate = function validate(value, options) {
      return this._resolve(value, options).validate(value, options);
    };

    return Lazy;
  })();

Lazy.prototype.__isYupSchema__ = true;

function setLocale(custom) {
  Object.keys(custom).forEach(function(type) {
    Object.keys(custom[type]).forEach(function(method) {
      locale[type][method] = custom[type][method];
    });
  });
}

var boolean$1 = BooleanSchema;

var ref = function ref(key, options) {
  return new Reference(key, options);
};

var lazy = function lazy(fn) {
  return new Lazy(fn);
};

function addMethod(schemaType, name, fn) {
  if (!schemaType || !isSchema(schemaType.prototype))
    throw new TypeError('You must provide a yup schema constructor function');
  if (typeof name !== 'string')
    throw new TypeError('A Method name must be provided');
  if (typeof fn !== 'function')
    throw new TypeError('Method function must be provided');
  schemaType.prototype[name] = fn;
}

exports.mixed = SchemaType;
exports.string = StringSchema;
exports.number = NumberSchema;
exports.bool = BooleanSchema;
exports.boolean = boolean$1;
exports.date = DateSchema;
exports.object = ObjectSchema;
exports.array = ArraySchema;
exports.ref = ref;
exports.lazy = lazy;
exports.reach = reach;
exports.isSchema = isSchema;
exports.addMethod = addMethod;
exports.setLocale = setLocale;
exports.ValidationError = ValidationError;
