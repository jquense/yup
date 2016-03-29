'use strict';

var Promise = require('promise/lib/es6-extensions'),
    Condition = require('./util/condition'),
    locale = require('./locale.js').mixed,
    _ = require('./util/_'),
    isAbsent = require('./util/isAbsent'),
    cloneDeep = require('./util/clone'),
    createValidation = require('./util/createValidation'),
    BadSet = require('./util/set'),
    Ref = require('./util/reference');

var notEmpty = function notEmpty(value) {
  return !isAbsent(value);
};

function runValidations(validations, endEarly, value, path) {
  return endEarly ? Promise.all(validations) : _.collectErrors(validations, value, path);
}

module.exports = SchemaType;

function SchemaType() {
  var _this = this;

  var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  if (!(this instanceof SchemaType)) return new SchemaType();

  this._deps = [];
  this._conditions = [];
  this._options = { abortEarly: true, recursive: true };
  this._exclusive = Object.create(null);
  this._whitelist = new BadSet();
  this._blacklist = new BadSet();
  this.tests = [];
  this.transforms = [];

  this.withMutation(function () {
    _this.typeError(locale.notType);
  });

  if (_.has(options, 'default')) this._defaultDefault = options['default'];

  this._type = options.type || 'mixed';
}

SchemaType.prototype = {

  __isYupSchema__: true,

  constructor: SchemaType,

  clone: function clone() {
    if (this._mutate) return this;

    return cloneDeep(this);
  },

  label: function label(_label) {
    var next = this.clone();
    next._label = _label;
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
    var next = _.merge(this.clone(), schema.clone());

    // undefined isn't merged over, but is a valid value for default
    if (schema._default === undefined && _.has(this, '_default')) next._default = schema._default;

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

  cast: function cast(value) {
    var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var schema = this._resolve(opts.context, opts.parent);
    return schema._cast(value, opts);
  },

  _cast: function _cast(_value) {
    var _this2 = this;

    var value = _value === undefined ? _value : this.transforms.reduce(function (value, transform) {
      return transform.call(_this2, value, _value);
    }, _value);

    if (value === undefined && _.has(this, '_default')) value = this['default']();

    return value;
  },

  _resolve: function _resolve(context, parent) {
    if (this._conditions.length) {
      return this._conditions.reduce(function (schema, match) {
        return match.resolve(schema, match.getValue(parent, context));
      }, this);
    }

    return this;
  },

  //-- tests
  _validate: function _validate(_value) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
    var state = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    var context = options.context,
        parent = state.parent,
        value = _value,
        schema = undefined,
        endEarly = undefined,
        isStrict = undefined;

    schema = this._resolve(context, parent);
    isStrict = schema._option('strict', options);
    endEarly = schema._option('abortEarly', options);

    var path = state.path;
    var label = this._label;

    if (!state.isCast && !isStrict) value = schema._cast(value, options);

    // value is cast, we can check if it meets type requirements
    var validationParams = { value: value, path: path, state: state, schema: schema, options: options, label: label };
    var initialTests = [];

    if (schema._typeError) initialTests.push(schema._typeError(validationParams));
    if (schema._whitelistError) initialTests.push(schema._whitelistError(validationParams));
    if (schema._blacklistError) initialTests.push(schema._blacklistError(validationParams));

    return runValidations(initialTests, endEarly, value, path).then(function () {
      return runValidations(schema.tests.map(function (fn) {
        return fn(validationParams);
      }), endEarly, value, path);
    }).then(function () {
      return value;
    });
  },

  validate: function validate(value, options, cb) {
    if (typeof options === 'function') cb = options, options = {};

    return nodeify(this._validate(value, options, {}), cb);
  },

  isValid: function isValid(value, options, cb) {
    if (typeof options === 'function') cb = options, options = {};

    return nodeify(this.validate(value, options).then(function () {
      return true;
    })['catch'](function (err) {
      if (err.name === 'ValidationError') return false;

      throw err;
    }), cb);
  },

  'default': function _default(def) {
    if (arguments.length === 0) {
      var dflt = _.has(this, '_default') ? this._default : this._defaultDefault;
      return typeof dflt === 'function' ? dflt.call(this) : cloneDeep(dflt);
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
    return this.test('required', msg || locale.required, notEmpty);
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
  test: function test(name, message, _test, useCallback) {
    var opts = name,
        next = this.clone();

    if (typeof name === 'string') {
      if (typeof message === 'function') _test = message, message = name, name = null;

      opts = { name: name, test: _test, message: message, useCallback: useCallback, exclusive: false };
    }

    if (typeof opts.message !== 'string' || typeof opts.test !== 'function') throw new TypeError('`message` and `test` are required parameters');

    var validate = createValidation(opts);

    var isExclusive = opts.exclusive || opts.name && next._exclusive[opts.name] === true;

    if (opts.exclusive && !opts.name) {
      throw new TypeError('You cannot have an exclusive validation without a `name`');
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
      return new Ref(key);
    });

    deps.forEach(function (dep) {
      if (!dep.isContext) next._deps.push(dep.key);
    });

    next._conditions.push(new Condition(deps, options));

    return next;
  },

  typeError: function typeError(message) {
    var next = this.clone();

    next._typeError = createValidation({
      message: message,
      name: 'typeError',
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
    var message = arguments.length <= 1 || arguments[1] === undefined ? locale.oneOf : arguments[1];

    var next = this.clone();

    if (next.tests.length) throw new TypeError('Cannot specify values when there are validation rules specified');

    enums.forEach(function (val) {
      next._blacklist['delete'](val);
      next._whitelist.add(val);
    });

    next._whitelistError = createValidation({
      message: message,
      name: 'oneOf',
      test: function test(value) {
        var valids = this.schema._whitelist;
        if (valids.length && !(value === undefined || valids.has(value))) return this.createError({
          params: {
            values: valids.values().join(', ')
          }
        });
        return true;
      }
    });

    return next;
  },

  notOneOf: function notOneOf(enums) {
    var message = arguments.length <= 1 || arguments[1] === undefined ? locale.notOneOf : arguments[1];

    var next = this.clone();

    enums.forEach(function (val) {
      next._whitelist['delete'](val);
      next._blacklist.add(val);
    });

    next._blacklistError = createValidation({
      message: message,
      name: 'notOneOf',
      test: function test(value) {
        var invalids = this.schema._blacklist;
        if (invalids.length && invalids.has(value)) return this.createError({
          params: {
            values: invalids.values().join(', ')
          }
        });
        return true;
      }
    });

    return next;
  },

  _option: function _option(key, overrides) {
    return _.has(overrides, key) ? overrides[key] : this._options[key];
  }
};

var aliases = {
  oneOf: ['equals', 'is'],
  notOneOf: ['not', 'nope']
};

for (var method in aliases) if (_.has(aliases, method)) aliases[method].forEach(function (alias) {
  return SchemaType.prototype[alias] = SchemaType.prototype[method];
}); //eslint-disable-line no-loop-func

function nodeify(promise, cb) {
  if (typeof cb !== 'function') return promise;

  promise.then(function (val) {
    return cb(null, val);
  }, function (err) {
    return cb(err);
  });
}

// [{ value, exclude }]

// values.every(({ value, exclude }) => {
//   var isEql = eql(value, otherval)
//   return (exclude && !isEql) || isEql
// })