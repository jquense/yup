import has from 'lodash/has';
import cloneDeepWith from 'lodash/cloneDeepWith';
import toArray from 'lodash/toArray';

import { mixed as locale } from './locale';
import Condition from './Condition';
import runTests from './util/runTests';
import prependDeep from './util/prependDeep';
import isSchema from './util/isSchema';
import createValidation from './util/createValidation';
import printValue from './util/printValue';
import Ref from './Reference';
import { getIn } from './util/reach';

class RefSet {
  constructor() {
    this.list = new Set();
    this.refs = new Map();
  }
  get size() {
    return this.list.size + this.refs.size;
  }
  describe() {
    const description = [];

    for (const item of this.list) description.push(item);
    for (const [, ref] of this.refs) description.push(ref.describe());

    return description;
  }
  toArray() {
    return toArray(this.list).concat(toArray(this.refs.values()));
  }
  add(value) {
    Ref.isRef(value) ? this.refs.set(value.key, value) : this.list.add(value);
  }
  delete(value) {
    Ref.isRef(value) ? this.refs.delete(value.key) : this.list.delete(value);
  }
  has(value, resolve) {
    if (this.list.has(value)) return true;

    let item,
      values = this.refs.values();
    while (((item = values.next()), !item.done))
      if (resolve(item.value) === value) return true;

    return false;
  }
  clone() {
    const next = new RefSet();
    next.list = new Set(this.list);
    next.refs = new Map(this.refs);
    return next;
  }
  merge(newItems, removeItems) {
    const next = this.clone();
    newItems.list.forEach((value) => next.add(value));
    newItems.refs.forEach((value) => next.add(value));
    removeItems.list.forEach((value) => next.delete(value));
    removeItems.refs.forEach((value) => next.delete(value));
    return next;
  }
}

export default function SchemaType(options = {}) {
  if (!(this instanceof SchemaType)) return new SchemaType();

  this._deps = [];
  this._conditions = [];
  this._options = { abortEarly: true, recursive: true };
  this._exclusive = Object.create(null);

  this._whitelist = new RefSet();
  this._blacklist = new RefSet();

  this.tests = [];
  this.transforms = [];

  this.withMutation(() => {
    this.typeError(locale.notType);
  });

  if (has(options, 'default')) this._defaultDefault = options.default;

  this.type = options.type || 'mixed';
  // TODO: remove
  this._type = options.type || 'mixed';
}

const proto = (SchemaType.prototype = {
  __isYupSchema__: true,

  constructor: SchemaType,

  clone() {
    if (this._mutate) return this;

    // if the nested value is a schema we can skip cloning, since
    // they are already immutable
    return cloneDeepWith(this, (value) => {
      if (isSchema(value) && value !== this) return value;
    });
  },

  label(label) {
    var next = this.clone();
    next._label = label;
    return next;
  },

  meta(obj) {
    if (arguments.length === 0) return this._meta;

    var next = this.clone();
    next._meta = Object.assign(next._meta || {}, obj);
    return next;
  },

  withMutation(fn) {
    let before = this._mutate;
    this._mutate = true;
    let result = fn(this);
    this._mutate = before;
    return result;
  },

  concat(schema) {
    if (!schema || schema === this) return this;

    if (schema._type !== this._type && this._type !== 'mixed')
      throw new TypeError(
        `You cannot \`concat()\` schema's of different types: ${this._type} and ${schema._type}`,
      );

    var next = prependDeep(schema.clone(), this);

    // new undefined default is overridden by old non-undefined one, revert
    if (has(schema, '_default')) next._default = schema._default;

    next.tests = this.tests;
    next._exclusive = this._exclusive;

    // manually merge the blacklist/whitelist (the other `schema` takes
    // precedence in case of conflicts)
    next._whitelist = this._whitelist.merge(
      schema._whitelist,
      schema._blacklist,
    );
    next._blacklist = this._blacklist.merge(
      schema._blacklist,
      schema._whitelist,
    );

    // manually add the new tests to ensure
    // the deduping logic is consistent
    next.withMutation((next) => {
      schema.tests.forEach((fn) => {
        next.test(fn.OPTIONS);
      });
    });

    return next;
  },

  isType(v) {
    if (this._nullable && v === null) return true;
    return !this._typeCheck || this._typeCheck(v);
  },

  resolve(options) {
    let schema = this;

    if (schema._conditions.length) {
      let conditions = schema._conditions;

      schema = schema.clone();
      schema._conditions = [];
      schema = conditions.reduce(
        (schema, condition) => condition.resolve(schema, options),
        schema,
      );

      schema = schema.resolve(options);
    }

    return schema;
  },
  /**
   *
   * @param {*} value
   * @param {Object} options
   * @param {*=} options.parent
   * @param {*=} options.context
   */
  cast(value, options = {}) {
    let resolvedSchema = this.resolve({
      value,
      ...options,
      // parent: options.parent,
      // context: options.context,
    });

    let result = resolvedSchema._cast(value, options);

    if (
      value !== undefined &&
      options.assert !== false &&
      resolvedSchema.isType(result) !== true
    ) {
      let formattedValue = printValue(value);
      let formattedResult = printValue(result);
      throw new TypeError(
        `The value of ${
          options.path || 'field'
        } could not be cast to a value ` +
          `that satisfies the schema type: "${resolvedSchema._type}". \n\n` +
          `attempted value: ${formattedValue} \n` +
          (formattedResult !== formattedValue
            ? `result of cast: ${formattedResult}`
            : ''),
      );
    }

    return result;
  },

  _cast(rawValue) {
    let value =
      rawValue === undefined
        ? rawValue
        : this.transforms.reduce(
            (value, fn) => fn.call(this, value, rawValue),
            rawValue,
          );

    if (value === undefined && has(this, '_default')) {
      value = this.default();
    }

    return value;
  },

  _validate(_value, options = {}, cb) {
    let {
      sync,
      path,
      from = [],
      originalValue = _value,
      strict = this._options.strict,
      abortEarly = this._options.abortEarly,
    } = options;

    let value = _value;
    if (!strict) {
      this._validating = true;
      value = this._cast(value, { assert: false, ...options });
      this._validating = false;
    }
    // value is cast, we can check if it meets type requirements
    let args = {
      value,
      path,
      options,
      originalValue,
      schema: this,
      label: this._label,
      sync,
      from,
    };

    let initialTests = [];

    if (this._typeError) initialTests.push(this._typeError);
    if (this._whitelistError) initialTests.push(this._whitelistError);
    if (this._blacklistError) initialTests.push(this._blacklistError);

    return runTests(
      {
        args,
        value,
        path,
        sync,
        tests: initialTests,
        endEarly: abortEarly,
      },
      (err) => {
        if (err) return void cb(err);

        runTests(
          {
            tests: this.tests,
            args,
            path,
            sync,
            value,
            endEarly: abortEarly,
          },
          cb,
        );
      },
    );
  },

  validate(value, options = {}, maybeCb) {
    let schema = this.resolve({ ...options, value });

    // callback case is for nested validations
    return typeof maybeCb === 'function'
      ? schema._validate(value, options, maybeCb)
      : new Promise((resolve, reject) =>
          schema._validate(value, options, (err, value) => {
            if (err) reject(err);
            else resolve(value);
          }),
        );
  },

  validateSync(value, options = {}) {
    let schema = this.resolve({ ...options, value });
    let result;

    schema._validate(value, { ...options, sync: true }, (err, value) => {
      if (err) throw err;
      result = value;
    });

    return result;
  },

  isValid(value, options) {
    return this.validate(value, options)
      .then(() => true)
      .catch((err) => {
        if (err.name === 'ValidationError') return false;
        throw err;
      });
  },

  isValidSync(value, options) {
    try {
      this.validateSync(value, options);
      return true;
    } catch (err) {
      if (err.name === 'ValidationError') return false;
      throw err;
    }
  },

  getDefault(options = {}) {
    let schema = this.resolve(options);
    return schema.default();
  },

  default(def) {
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

  strict(isStrict = true) {
    var next = this.clone();
    next._options.strict = isStrict;
    return next;
  },

  _isPresent(value) {
    return value != null;
  },

  required(message = locale.required) {
    return this.test({
      message,
      name: 'required',
      exclusive: true,
      test(value) {
        return this.schema._isPresent(value);
      },
    });
  },

  notRequired() {
    var next = this.clone();
    next.tests = next.tests.filter((test) => test.OPTIONS.name !== 'required');
    return next;
  },

  nullable(isNullable = true) {
    var next = this.clone();
    next._nullable = isNullable;
    return next;
  },

  transform(fn) {
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
  test(...args) {
    let opts;

    if (args.length === 1) {
      if (typeof args[0] === 'function') {
        opts = { test: args[0] };
      } else {
        opts = args[0];
      }
    } else if (args.length === 2) {
      opts = { name: args[0], test: args[1] };
    } else {
      opts = { name: args[0], message: args[1], test: args[2] };
    }

    if (opts.message === undefined) opts.message = locale.default;

    if (typeof opts.test !== 'function')
      throw new TypeError('`test` is a required parameters');

    let next = this.clone();
    let validate = createValidation(opts);

    let isExclusive =
      opts.exclusive || (opts.name && next._exclusive[opts.name] === true);

    if (opts.exclusive && !opts.name) {
      throw new TypeError(
        'Exclusive tests must provide a unique `name` identifying the test',
      );
    }

    next._exclusive[opts.name] = !!opts.exclusive;

    next.tests = next.tests.filter((fn) => {
      if (fn.OPTIONS.name === opts.name) {
        if (isExclusive) return false;
        if (fn.OPTIONS.test === validate.OPTIONS.test) return false;
      }
      return true;
    });

    next.tests.push(validate);

    return next;
  },

  when(keys, options) {
    if (arguments.length === 1) {
      options = keys;
      keys = '.';
    }

    var next = this.clone(),
      deps = [].concat(keys).map((key) => new Ref(key));

    deps.forEach((dep) => {
      if (dep.isSibling) next._deps.push(dep.key);
    });

    next._conditions.push(new Condition(deps, options));

    return next;
  },

  typeError(message) {
    var next = this.clone();

    next._typeError = createValidation({
      message,
      name: 'typeError',
      test(value) {
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

  oneOf(enums, message = locale.oneOf) {
    var next = this.clone();

    enums.forEach((val) => {
      next._whitelist.add(val);
      next._blacklist.delete(val);
    });

    next._whitelistError = createValidation({
      message,
      name: 'oneOf',
      test(value) {
        if (value === undefined) return true;
        let valids = this.schema._whitelist;

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

  notOneOf(enums, message = locale.notOneOf) {
    var next = this.clone();
    enums.forEach((val) => {
      next._blacklist.add(val);
      next._whitelist.delete(val);
    });

    next._blacklistError = createValidation({
      message,
      name: 'notOneOf',
      test(value) {
        let invalids = this.schema._blacklist;
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

  strip(strip = true) {
    let next = this.clone();
    next._strip = strip;
    return next;
  },

  _option(key, overrides) {
    return has(overrides, key) ? overrides[key] : this._options[key];
  },

  describe() {
    const next = this.clone();
    const description = {
      type: next._type,
      meta: next._meta,
      label: next._label,
      tests: next.tests
        .map((fn) => ({ name: fn.OPTIONS.name, params: fn.OPTIONS.params }))
        .filter(
          (n, idx, list) => list.findIndex((c) => c.name === n.name) === idx,
        ),
    };

    if (next._whitelist.size) description.oneOf = next._whitelist.describe();
    if (next._blacklist.size) description.notOneOf = next._blacklist.describe();

    return description;
  },

  defined(message = locale.defined) {
    return this.nullable().test({
      message,
      name: 'defined',
      exclusive: true,
      test(value) {
        return value !== undefined;
      },
    });
  },
});

for (const method of ['validate', 'validateSync'])
  proto[`${method}At`] = function (path, value, options = {}) {
    const { parent, parentPath, schema } = getIn(
      this,
      path,
      value,
      options.context,
    );
    return schema[method](parent && parent[parentPath], {
      ...options,
      parent,
      path,
    });
  };

for (const alias of ['equals', 'is']) proto[alias] = proto.oneOf;
for (const alias of ['not', 'nope']) proto[alias] = proto.notOneOf;
proto.optional = proto.notRequired;
