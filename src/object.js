import has from 'lodash/has';
import snakeCase from 'lodash/snakeCase';
import camelCase from 'lodash/camelCase';
import mapKeys from 'lodash/mapKeys';
import mapValues from 'lodash/mapValues';
import { getter } from 'property-expr';

import MixedSchema from './mixed';
import { object as locale } from './locale.js';
import sortFields from './util/sortFields';
import sortByKeyOrder from './util/sortByKeyOrder';
import inherits from './util/inherits';
import makePath from './util/makePath';
import runValidations from './util/runValidations';

let isObject = (obj) =>
  Object.prototype.toString.call(obj) === '[object Object]';

function unknown(ctx, value) {
  let known = Object.keys(ctx.fields);
  return Object.keys(value).filter((key) => known.indexOf(key) === -1);
}

export default function ObjectSchema(spec) {
  if (!(this instanceof ObjectSchema)) return new ObjectSchema(spec);

  MixedSchema.call(this, {
    type: 'object',
    default() {
      if (!this._nodes.length) return undefined;

      let dft = {};
      this._nodes.forEach((key) => {
        dft[key] = this.fields[key].default
          ? this.fields[key].default()
          : undefined;
      });
      return dft;
    },
  });

  this.fields = {};
  this._nodes = [];
  this._excludedEdges = [];

  this.withMutation(() => {
    this.transform(function coerce(value) {
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
      this.shape(spec);
    }
  });
}

inherits(ObjectSchema, MixedSchema, {
  _typeCheck(value) {
    return isObject(value) || typeof value === 'function';
  },

  _cast(_value, options = {}) {
    let value = MixedSchema.prototype._cast.call(this, _value, options);

    //should ignore nulls here
    if (value === undefined) return this.default();

    if (!this._typeCheck(value)) return value;

    let fields = this.fields;

    let strip = this._option('stripUnknown', options) === true;
    let props = this._nodes.concat(
      Object.keys(value).filter((v) => this._nodes.indexOf(v) === -1),
    );

    let intermediateValue = {}; // is filled during the transform below
    let innerOptions = {
      ...options,
      parent: intermediateValue,
      __validating: options.__validating || false,
    };

    let isChanged = false;
    props.forEach((prop) => {
      let field = fields[prop];
      let exists = has(value, prop);

      if (field && field.resolve) {
        let fieldValue;
        let strict = field._options && field._options.strict;

        // safe to mutate since this is fired in sequence
        innerOptions.path = makePath`${options.path}.${prop}`;
        innerOptions.value = value[prop];

        field = field.resolve(innerOptions);

        if (field._strip === true) {
          isChanged = isChanged || prop in value;
          return;
        }

        fieldValue =
          !options.__validating || !strict
            ? field.cast(value[prop], innerOptions)
            : value[prop];

        if (fieldValue !== undefined) intermediateValue[prop] = fieldValue;
      } else if (exists && !strip) intermediateValue[prop] = value[prop];

      if (intermediateValue[prop] !== value[prop]) isChanged = true;
    });
    return isChanged ? intermediateValue : value;
  },

  _validate(_value, opts = {}, callback) {
    let endEarly, recursive;
    let sync = opts.sync;
    let errors = [];
    let originalValue =
      opts.originalValue != null ? opts.originalValue : _value;

    let from = [{ schema: this, value: originalValue }, ...(opts.from || [])];

    endEarly = this._option('abortEarly', opts);
    recursive = this._option('recursive', opts);

    opts = { ...opts, __validating: true, originalValue, from };

    MixedSchema.prototype._validate.call(this, _value, opts, (err, value) => {
      if (err) {
        if (endEarly) return void callback(err);
        errors.push(err);
        value = err.value;
      }

      if (!recursive || !isObject(value)) {
        callback(errors[0] || null, value);
        return;
      }

      from = originalValue
        ? [...from]
        : [
            { schema: this, value: originalValue || value },
            ...(opts.from || []),
          ];
      originalValue = originalValue || value;

      let validations = this._nodes.map((key) => {
        let path =
          key.indexOf('.') === -1
            ? makePath`${opts.path}.${key}`
            : makePath`${opts.path}["${key}"]`;
        let field = this.fields[key];

        let innerOptions = {
          ...opts,
          path,
          from,
          parent: value,
          originalValue: originalValue[key],
        };

        if (field && field.validate) {
          // inner fields are always strict:
          // 1. this isn't strict so the casting will also have cast inner values
          // 2. this is strict in which case the nested values weren't cast either
          innerOptions.strict = true;

          return (cb) => field.validate(value[key], innerOptions, cb);
        }

        return (cb) => cb(null, true);
      });

      runValidations(
        {
          sync,
          validations,
          value,
          errors,
          endEarly,
          path: opts.path,
          sort: sortByKeyOrder(this.fields),
        },
        callback,
      );
    });
  },

  concat(schema) {
    var next = MixedSchema.prototype.concat.call(this, schema);

    next._nodes = sortFields(next.fields, next._excludedEdges);

    return next;
  },

  shape(schema, excludes = []) {
    let next = this.clone();
    let fields = Object.assign(next.fields, schema);

    next.fields = fields;

    if (excludes.length) {
      if (!Array.isArray(excludes[0])) excludes = [excludes];

      let keys = excludes.map(([first, second]) => `${first}-${second}`);

      next._excludedEdges = next._excludedEdges.concat(keys);
    }

    next._nodes = sortFields(fields, next._excludedEdges);

    return next;
  },

  from(from, to, alias) {
    let fromGetter = getter(from, true);

    return this.transform((obj) => {
      if (obj == null) return obj;
      let newObj = obj;
      if (has(obj, from)) {
        newObj = { ...obj };
        if (!alias) delete newObj[from];

        newObj[to] = fromGetter(obj);
      }

      return newObj;
    });
  },

  noUnknown(noAllow = true, message = locale.noUnknown) {
    if (typeof noAllow === 'string') {
      message = noAllow;
      noAllow = true;
    }

    let next = this.test({
      name: 'noUnknown',
      exclusive: true,
      message: message,
      test(value) {
        if (value == null) return true;
        const unknownKeys = unknown(this.schema, value);
        return (
          !noAllow ||
          unknownKeys.length === 0 ||
          this.createError({ params: { unknown: unknownKeys.join(', ') } })
        );
      },
    });

    next._options.stripUnknown = noAllow;

    return next;
  },

  unknown(allow = true, message = locale.noUnknown) {
    return this.noUnknown(!allow, message);
  },

  transformKeys(fn) {
    return this.transform((obj) => obj && mapKeys(obj, (_, key) => fn(key)));
  },

  camelCase() {
    return this.transformKeys(camelCase);
  },

  snakeCase() {
    return this.transformKeys(snakeCase);
  },

  constantCase() {
    return this.transformKeys((key) => snakeCase(key).toUpperCase());
  },

  describe() {
    let base = MixedSchema.prototype.describe.call(this);
    base.fields = mapValues(this.fields, (value) => value.describe());
    return base;
  },
});
