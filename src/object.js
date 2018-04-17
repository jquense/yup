import has from 'lodash/has';
import omit from 'lodash/omit';
import snakeCase from 'lodash/snakeCase';
import camelCase from 'lodash/camelCase';
import mapKeys from 'lodash/mapKeys';
import transform from 'lodash/transform';
import { getter } from 'property-expr';

import MixedSchema from './mixed';
import { object as locale } from './locale.js';
import sortFields from './util/sortFields';
import sortByKeyOrder from './util/sortByKeyOrder';
import inherits from './util/inherits';
import makePath from './util/makePath';
import runValidations, { propagateErrors } from './util/runValidations';

let isObject = obj => Object.prototype.toString.call(obj) === '[object Object]';

function unknown(ctx, value) {
  var known = Object.keys(ctx.fields);
  return Object.keys(value).filter(key => known.indexOf(key) === -1);
}

export default function ObjectSchema(spec) {
  if (!(this instanceof ObjectSchema)) return new ObjectSchema(spec);

  MixedSchema.call(this, {
    type: 'object',
    default() {
      var dft = transform(
        this._nodes,
        (obj, key) => {
          obj[key] = this.fields[key].default
            ? this.fields[key].default()
            : undefined;
        },
        {},
      );

      return Object.keys(dft).length === 0 ? undefined : dft;
    },
  });

  this.fields = Object.create(null);
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
    var value = MixedSchema.prototype._cast.call(this, _value, options);

    //should ignore nulls here
    if (value === undefined) return this.default();

    if (!this._typeCheck(value)) return value;

    let fields = this.fields,
      strip = this._option('stripUnknown', options) === true,
      extra = Object.keys(value).filter(v => this._nodes.indexOf(v) === -1),
      props = this._nodes.concat(extra);

    let innerOptions = {
      ...options,
      parent: {}, // is filled during the transform below
      __validating: false,
    };

    value = transform(
      props,
      (obj, prop) => {
        let field = fields[prop];
        let exists = has(value, prop);

        if (field) {
          let fieldValue;
          let strict = field._options && field._options.strict;

          // safe to mutate since this is fired in sequence
          innerOptions.path = makePath`${options.path}.${prop}`;
          innerOptions.fieldValue = value[prop];

          field = field.resolve(innerOptions);

          if (field._strip === true) return;

          fieldValue =
            !options.__validating || !strict
              ? field.cast(value[prop], innerOptions)
              : value[prop];

          if (fieldValue !== undefined) obj[prop] = fieldValue;
        } else if (exists && !strip) obj[prop] = value[prop];
      },
      innerOptions.parent,
    );

    return value;
  },

  _validate(_value, opts = {}) {
    let endEarly, recursive;
    let sync = opts.sync;
    let errors = [];
    let originalValue =
      opts.originalValue != null ? opts.originalValue : _value;

    endEarly = this._option('abortEarly', opts);
    recursive = this._option('recursive', opts);

    opts = { ...opts, __validating: true, originalValue };

    return MixedSchema.prototype._validate
      .call(this, _value, opts)
      .catch(propagateErrors(endEarly, errors))
      .then(value => {
        if (!recursive || !isObject(value)) {
          // only iterate though actual objects
          if (errors.length) throw errors[0];
          return value;
        }

        originalValue = originalValue || value;

        let validations = this._nodes.map(key => {
          let path = makePath`${opts.path}.${key}`;
          let field = this.fields[key];

          let innerOptions = {
            ...opts,
            path,
            parent: value,
            originalValue: originalValue[key],
          };

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
          sync,
          validations,
          value,
          errors,
          endEarly,
          path: opts.path,
          sort: sortByKeyOrder(this.fields),
        });
      });
  },

  concat(schema) {
    var next = MixedSchema.prototype.concat.call(this, schema);

    next._nodes = sortFields(next.fields, next._excludedEdges);

    return next;
  },

  shape(schema, excludes = []) {
    var next = this.clone(),
      fields = Object.assign(next.fields, schema);

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

    return this.transform(obj => {
      var newObj = obj;

      if (obj == null) return obj;

      if (has(obj, from)) {
        newObj = alias ? { ...obj } : omit(obj, from);
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

    var next = this.test({
      name: 'noUnknown',
      exclusive: true,
      message: message,
      test(value) {
        return (
          value == null || !noAllow || unknown(this.schema, value).length === 0
        );
      },
    });

    if (noAllow) next._options.stripUnknown = true;

    return next;
  },

  transformKeys(fn) {
    return this.transform(obj => obj && mapKeys(obj, (_, key) => fn(key)));
  },

  camelCase() {
    return this.transformKeys(camelCase);
  },

  snakeCase() {
    return this.transformKeys(snakeCase);
  },

  constantCase() {
    return this.transformKeys(key => snakeCase(key).toUpperCase());
  },
});
