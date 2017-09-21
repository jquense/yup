/* eslint-disable no-param-reassign */
import has from 'lodash/has';
import cloneDeepWith from 'lodash/cloneDeepWith';
import toArray from 'lodash/toArray';

import { mixed as locale } from './locale';
import Condition from './Condition';
import runValidations from './util/runValidations';
import merge from './util/merge';
import isSchema from './util/isSchema';
import isAbsent from './util/isAbsent';
import createValidation from './util/createValidation';
import printValue from './util/printValue';
import Ref from './Reference';

const notEmpty = value => !isAbsent(value);

function extractTestParams(name, message, test) {
  let opts = name;

  if (typeof message === 'function') {
    test = message; message = locale.default; name = null;
  }

  if (typeof name === 'function') {
    test = name; message = locale.default; name = null;
  }

  if (typeof name === 'string' || name === null) { opts = { name, test, message, exclusive: false }; }

  if (typeof opts.test !== 'function') { throw new TypeError('`test` is a required parameters'); }

  return opts;
}

export default function SchemaType(options = {}) {
  if (!(this instanceof SchemaType)) { return new SchemaType(); }

  this._deps = [];
  this._conditions = [];
  this._options = { abortEarly: true, recursive: true, sync: false };
  this._exclusive = Object.create(null);
  this._whitelist = new Set();
  this._blacklist = new Set();
  this.tests = [];
  this.transforms = [];

  this.withMutation(() => {
    this.typeError(locale.notType);
  });

  if (has(options, 'default')) { this._defaultDefault = options.default; }

  this._type = options.type || 'mixed';
}

SchemaType.prototype = {

  __isYupSchema__: true,

  constructor: SchemaType,

  clone() {
    if (this._mutate) { return this; }

    // if the nested value is a schema we can skip cloning, since
    // they are already immutable
    return cloneDeepWith(this, (value) => {
      if (isSchema(value) && value !== this) {
        return value;
      }
      return undefined;
    });
  },

  label(label) {
    const next = this.clone();
    next._label = label;
    return next;
  },

  meta(obj) {
    if (arguments.length === 0) { return this._meta; }

    const next = this.clone();
    next._meta = Object.assign(next._meta || {}, obj);
    return next;
  },

  withMutation(fn) {
    this._mutate = true;
    const result = fn(this);
    this._mutate = false;
    return result;
  },

  concat(schema) {
    if (!schema) { return this; }

    if (schema._type !== this._type && this._type !== 'mixed') { throw new TypeError(`You cannot \`concat()\` schema's of different types: ${this._type} and ${schema._type}`); }
    const cloned = this.clone();
    let next = merge(this.clone(), schema.clone());

    // undefined isn't merged over, but is a valid value for default
    if (has(schema, '_default')) { next._default = schema._default; }

    next.tests = cloned.tests;
    next._exclusive = cloned._exclusive;

    // manually add the new tests to ensure
    // the deduping logic is consistent
    schema.tests.forEach((fn) => {
      next = next.test(fn.TEST);
    });

    next._type = schema._type;

    return next;
  },

  isType(v) {
    if (this._nullable && v === null) return true;
    return !this._typeCheck || this._typeCheck(v);
  },

  resolve({ context, parent }) {
    if (this._conditions.length) {
      return this._conditions.reduce((schema, match) =>
        match.resolve(schema, match.getValue(parent, context)), this);
    }

    return this;
  },

  cast(value, options = {}) {
    const resolvedSchema = this.resolve(options);
    const result = resolvedSchema._cast(value, options);

    if (
      value !== undefined &&
      options.assert !== false &&
      resolvedSchema.isType(result) !== true
    ) {
      const formattedValue = printValue(value);
      const formattedResult = printValue(result);
      throw new TypeError(
        `${`The value of ${options.path || 'field'} could not be cast to a value ` +
        `that satisfies the schema type: "${resolvedSchema._type}". \n\n` +
        `attempted value: ${formattedValue} \n`}${
          (formattedResult !== formattedValue)
            ? `result of cast: ${formattedResult}` : ''}`,
      );
    }

    return result;
  },

  _cast(rawValue) {
    let value = rawValue === undefined ? rawValue
      : this.transforms.reduce(
        (val, fn) => fn.call(this, val, rawValue), rawValue);

    if (value === undefined && has(this, '_default')) {
      value = this.default();
    }

    return value;
  },

  validate(value, options = {}) {
    const schema = this.resolve(options);
    return schema._validate(value, options);
  },

  validateSync(value, options = {}) {
    let result;
    let error;
    this.validate(value, { ...options, sync: true }).then((res) => {
      result = res;
    }).catch((err) => {
      error = err;
    });
    if (error) {
      throw error;
    }
    return result;
  },

  _validate(_value, options = {}) {
    let value = _value;
    const originalValue = options.originalValue != null ? options.originalValue : _value;

    const isStrict = this._option('strict', options);
    const abortEarly = this._option('abortEarly', options);
    const sync = this._option('sync', options);

    const path = options.path;
    const label = this._label;

    if (!isStrict) {
      value = this._cast(value, { assert: false, ...options });
    }
    // value is cast, we can check if it meets type requirements
    const validationParams = { value, path, schema: this, options, sync, label, originalValue };
    const initialTests = [];

    if (this._typeError) { initialTests.push(this._typeError(validationParams)); }

    if (this._whitelistError) { initialTests.push(this._whitelistError(validationParams)); }

    if (this._blacklistError) { initialTests.push(this._blacklistError(validationParams)); }

    return runValidations({
      validations: initialTests,
      abortEarly,
      sync,
      value,
      path,
    })
      .then(val => runValidations({
        path,
        value: val,
        abortEarly,
        sync,
        validations: this.tests.map(fn => fn(validationParams)),
      }));
  },


  isValid(value, options) {
    return this
      .validate(value, options)
      .then(() => true)
      .catch((err) => {
        if (err.name === 'ValidationError') {
          return false;
        }

        throw err;
      });
  },

  isValidSync(value, options) {
    try {
      this.validateSync(value, options);
      return true;
    } catch (err) {
      if (err.name === 'ValidationError') {
        return false;
      }

      throw err;
    }
  },

  getDefault({ context, parent }) {
    return this._resolve(context, parent).default();
  },

  default(def) {
    if (arguments.length === 0) {
      const defaultValue = has(this, '_default')
        ? this._default
        : this._defaultDefault;

      return typeof defaultValue === 'function'
        ? defaultValue.call(this)
        : cloneDeepWith(defaultValue);
    }

    const next = this.clone();
    next._default = def;
    return next;
  },

  strict() {
    const next = this.clone();
    next._options.strict = true;
    return next;
  },

  required(msg) {
    return this.test(
      'required',
      msg || locale.required,
      notEmpty,
    );
  },

  nullable(value) {
    const next = this.clone();
    next._nullable = value !== false;
    return next;
  },

  transform(fn) {
    const next = this.clone();
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
  test(name, message, test) {
    const opts = extractTestParams(name, message, test);
    const next = this.clone();

    const sync = this._option('sync');

    const validate = createValidation({ ...opts, sync });

    const isExclusive = (
      opts.exclusive ||
      (opts.name && next._exclusive[opts.name] === true)
    );

    if (opts.exclusive && !opts.name) {
      throw new TypeError('Exclusive tests must provide a unique `name` identifying the test');
    }

    next._exclusive[opts.name] = !!opts.exclusive;

    next.tests = next.tests
      .filter((fn) => {
        if (fn.TEST_NAME === opts.name) {
          if (isExclusive) return false;
          if (fn.TEST.test === validate.TEST.test) return false;
        }
        return true;
      });

    next.tests.push(validate);

    return next;
  },

  when(keys, options) {
    const next = this.clone();
    const deps = [].concat(keys).map(key => new Ref(key));

    deps.forEach((dep) => {
      if (!dep.isContext) { next._deps.push(dep.key); }
    });

    next._conditions.push(new Condition(deps, options));

    return next;
  },

  typeError(message) {
    const next = this.clone();

    next._typeError = createValidation({
      name: 'typeError',
      message,
      test(value) {
        if (value !== undefined && !this.schema.isType(value)) {
          return this.createError({
            params: {
              type: this.schema._type,
            },
          });
        }
        return true;
      },
    });
    return next;
  },

  oneOf(enums, message = locale.oneOf) {
    const next = this.clone();

    enums.forEach((val) => {
      if (next._blacklist.has(val)) { next._blacklist.delete(val); }
      next._whitelist.add(val);
    });

    next._whitelistError = createValidation({
      message,
      name: 'oneOf',
      test(value) {
        const valids = this.schema._whitelist;
        if (valids.size && !(value === undefined || valids.has(value))) {
          return this.createError({
            params: {
              values: toArray(valids).join(', '),
            },
          });
        }
        return true;
      },
    });

    return next;
  },

  notOneOf(enums, message = locale.notOneOf) {
    const next = this.clone();

    enums.forEach((val) => {
      next._whitelist.delete(val);
      next._blacklist.add(val);
    });

    next._blacklistError = createValidation({
      message,
      name: 'notOneOf',
      test(value) {
        const invalids = this.schema._blacklist;
        if (invalids.size && invalids.has(value)) {
          return this.createError({
            params: {
              values: toArray(invalids).join(', '),
            },
          });
        }
        return true;
      },
    });

    return next;
  },

  strip(strip = true) {
    const next = this.clone();
    next._strip = strip;
    return next;
  },

  _option(key, overrides) {
    return has(overrides, key)
      ? overrides[key] : this._options[key];
  },

  describe() {
    const next = this.clone();

    return {
      type: next._type,
      meta: next._meta,
      label: next._label,
      tests: next.tests.map(fn => fn.TEST_NAME, {}),
    };
  },
};


const aliases = {
  oneOf: ['equals', 'is'],
  notOneOf: ['not', 'nope'],
};

Object.keys(aliases).forEach((method) => {
  aliases[method].forEach((alias) => {
    SchemaType.prototype[alias] = SchemaType.prototype[method];
  });
});
