'use strict';

var babelHelpers = require('./util/babelHelpers.js');

var Promise = require('promise/lib/es6-extensions'),
    Condition = require('./util/condition'),
    ValidationError = require('./util/validation-error'),
    getter = require('property-expr').getter,
    locale = require('./locale.js').mixed,
    _ = require('./util/_'),
    cloneDeep = require('./util/clone'),
    BadSet = require('./util/set');

var formatError = ValidationError.formatError;

module.exports = SchemaType;

function SchemaType() {
  var options = arguments[0] === undefined ? {} : arguments[0];

  if (!(this instanceof SchemaType)) return new SchemaType();

  this._deps = [];
  this._conditions = [];
  this._options = { abortEarly: true };
  this._exclusive = Object.create(null);
  this._whitelist = new BadSet();
  this._blacklist = new BadSet();
  this.tests = [];
  this.transforms = [];
  this._typeError = formatError(locale.notType);

  if (_.has(options, 'default')) this._defaultDefault = options['default'];

  this._type = options.type || 'mixed';
}

SchemaType.prototype = {

  __isYupSchema__: true,

  constructor: SchemaType,

  clone: function clone() {
    return cloneDeep(this);
  },

  concat: function concat(schema) {
    if (!schema) return this;

    if (schema._type !== this._type) throw new TypeError('You cannot `concat()` schema\'s of different types: ' + this._type + ' and ' + schema._type);

    var next = _.merge(this.clone(), schema.clone());

    // undefined isn't merged over, but is a valid value for default
    if (schema._default === undefined && _.has(this, '_default')) next._default = schema._default;

    // trim exclusive tests, take the most recent ones
    next.tests = _.uniq(next.tests.reverse(), function (fn, idx) {
      return next[fn.VALIDATION_KEY] ? fn.VALIDATION_KEY : idx;
    }).reverse();

    return next;
  },

  isType: function isType(v) {
    if (this._nullable && v === null) return true;
    return !this._typeCheck || this._typeCheck(v);
  },

  cast: function cast(_value, _opts) {
    var schema = this._resolve((_opts || {}).context);
    return schema._cast(_value, _opts);
  },

  _cast: function _cast(_value) {
    var _this = this;

    var value = _value === undefined ? _value : this.transforms.reduce(function (value, transform) {
      return transform.call(_this, value, _value);
    }, _value);

    if (value === undefined && _.has(this, '_default')) value = this['default']();

    return value;
  },

  _resolve: function _resolve(context) {
    var schema = this;

    return this._conditions.reduce(function (schema, match) {
      if (!context) throw new Error('missing the context necessary to cast this value');
      return match.resolve(schema, getter(match.key)(context));
    }, schema);
  },

  //-- tests
  _validate: function _validate(value, _opts, _state) {
    var valids = this._whitelist,
        invalids = this._blacklist,
        context = (_opts || {}).context || _state.parent,
        schema = undefined,
        state = undefined,
        endEarly = undefined,
        isStrict = undefined;

    state = _state;
    schema = this._resolve(context);
    isStrict = schema._option('strict', _opts);
    endEarly = schema._option('abortEarly', _opts);

    var path = state.path;

    var errors = [];
    var reject = function reject() {
      return Promise.reject(new ValidationError(errors, value));
    };

    if (!state.isCast && !isStrict) value = schema._cast(value, _opts);

    // value is cast, we can check if it meets type requirements
    if (value !== undefined && !schema.isType(value)) {
      errors.push(schema._typeError({ value: value, path: path, type: schema._type }));
      if (endEarly) return reject();
    }

    // next check Whitelist for matching values
    if (valids.length && !valids.has(value)) {
      errors.push(schema._whitelistError(valids.values(), path));
      if (endEarly) return reject();
    }

    // next check Blacklist for matching values
    if (invalids.has(value)) {
      errors.push(schema._blacklistError(invalids.values(), path));
      if (endEarly) return reject();
    }

    // It makes no sense to validate further at this point if their are errors
    if (errors.length) return reject();

    var result = schema.tests.map(function (fn) {
      return fn.call(schema, value, path, context);
    });

    result = endEarly ? Promise.all(result) : _.collectErrors(result, value, path);

    return result.then(function () {
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
    return this.test({
      name: 'required',
      exclusive: true,
      message: msg || locale.required,
      test: function test(value) {
        return value != null;
      }
    });
  },

  typeError: function typeError(msg) {
    var next = this.clone();
    next._typeError = formatError(msg);
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

  test: (function (_test) {
    function test(_x, _x2, _x3, _x4) {
      return _test.apply(this, arguments);
    }

    test.toString = function () {
      return _test.toString();
    };

    return test;
  })(function (name, message, test, useCallback) {
    var opts = name,
        next = this.clone(),
        errorMsg,
        isExclusive;

    if (typeof name === 'string') {
      if (typeof message === 'function') test = message, message = name, name = null;

      opts = { name: name, test: test, message: message, useCallback: useCallback, exclusive: false };
    }

    if (typeof opts.message !== 'string' || typeof opts.test !== 'function') throw new TypeError('`message` and `test` are required parameters');

    if (next._whitelist.length) throw new Error('Cannot add tests when specific valid values are specified');

    errorMsg = formatError(opts.message || locale['default']);

    isExclusive = opts.name && next._exclusive[opts.name] === true;

    if (opts.exclusive || isExclusive) {
      if (!opts.name) throw new TypeError('You cannot have an exclusive validation without a `name`');

      next._exclusive[opts.name] = true;
      validate.VALIDATION_KEY = opts.name;
    }

    if (isExclusive) next.tests = next.tests.filter(function (fn) {
      return fn.VALIDATION_KEY !== opts.name;
    });

    next.tests.push(validate);

    return next;

    function validate(value, path, context) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        !opts.useCallback ? resolve(opts.test.call(_this2, value, path, context)) : opts.test.call(_this2, value, path, context, function (err, valid) {
          return err ? reject(err) : resolve(valid);
        });
      }).then(function (valid) {
        if (!valid) throw new ValidationError(errorMsg(babelHelpers._extends({ path: path }, opts.params)), value, path);
      });
    }
  }),

  when: function when(key, options) {
    var next = this.clone();

    next._deps.push(key);
    next._conditions.push(new Condition(key, next._type, options));
    return next;
  },

  oneOf: function oneOf(enums, msg) {
    var next = this.clone();

    if (next.tests.length) throw new TypeError('Cannot specify values when there are validation rules specified');

    next._whitelistError = function (valids, path) {
      return formatError(msg || locale.oneOf, { values: valids.join(', '), path: path });
    };

    enums.forEach(function (val) {
      next._blacklist['delete'](val);
      next._whitelist.add(val);
    });

    return next;
  },

  notOneOf: function notOneOf(enums, msg) {
    var next = this.clone();

    next._blacklistError = function (invalids, path) {
      return formatError(msg || locale.notOneOf, { values: invalids.join(', '), path: path });
    };

    enums.forEach(function (val) {
      next._whitelist['delete'](val);
      next._blacklist.add(val);
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