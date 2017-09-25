/* eslint-disable no-param-reassign */
import { getter } from 'property-expr';
import camelCase from 'lodash/camelCase';
import has from 'lodash/has';
import isArray from 'lodash/isArray';
import isPlainObject from 'lodash/isPlainObject';
import mapKeys from 'lodash/mapKeys';
import omit from 'lodash/omit';
import snakeCase from 'lodash/snakeCase';
import transform from 'lodash/transform';

import MixedSchema from './mixed';
import { object as locale } from './locale';
import sortFields from './util/sortFields';
import sortByKeyOrder from './util/sortByKeyOrder';
import inherits from './util/inherits';
import makePath from './util/makePath';
import runValidations, { propagateErrors } from './util/runValidations';

function unknown(ctx, value) {
  const known = Object.keys(ctx.fields);
  return Object.keys(value)
    .filter(key => known.indexOf(key) === -1);
}


export default function ObjectSchema(spec) {
  if (!(this instanceof ObjectSchema)) { return new ObjectSchema(spec); }

  MixedSchema.call(this, { type: 'object',
    default() {
      const dft = transform(this._nodes, (obj, key) => {
        obj[key] = this.fields[key].default
          ? this.fields[key].default()
          : undefined;
      }, {});

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
        } catch (err) { value = null; }
      }
      if (this.isType(value)) { return value; }
      return null;
    });

    if (spec) {
      this.shape(spec);
    }
  });
}

inherits(ObjectSchema, MixedSchema, {

  _typeCheck(value) {
    return isPlainObject(value) || typeof value === 'function';
  },

  _cast(_value, options = {}) {
    let value = MixedSchema.prototype._cast.call(this, _value, options);

    // should ignore nulls here
    if (value === undefined) { return this.default(); }

    if (!this._typeCheck(value)) { return value; }

    const fields = this.fields;
    const strip = this._option('stripUnknown', options) === true;
    const extra = Object.keys(value).filter(v => this._nodes.indexOf(v) === -1);
    const props = this._nodes.concat(extra);

    const innerOptions = {
      ...options,
      parent: {}, // is filled during the transform below
      __validating: false,
    };

    value = transform(props, (obj, prop) => {
      let field = fields[prop];
      const exists = has(value, prop);

      if (field) {
        const strict = field._options && field._options.strict;

        // safe to mutate since this is fired in sequence
        innerOptions.path = makePath`${options.path}.${prop}`;
        innerOptions.value = value[prop];

        field = field.resolve(innerOptions);

        if (field._strip === true) { return; }

        const fieldValue = !options.__validating || !strict
          ? field.cast(value[prop], innerOptions)
          : value[prop];

        if (fieldValue !== undefined) {
          obj[prop] = fieldValue;
        }
      } else if (exists && !strip) {
        obj[prop] = value[prop];
      }
    }, innerOptions.parent);

    return value;
  },

  _validate(_value, opts = {}) {
    const errors = [];
    let originalValue = opts.originalValue != null ? opts.originalValue : _value;

    const abortEarly = this._option('abortEarly', opts);
    const recursive = this._option('recursive', opts);
    const sync = this._option('sync', opts);

    opts = { ...opts, __validating: true, originalValue };

    return MixedSchema.prototype._validate
      .call(this, _value, opts)
      .catch(propagateErrors(abortEarly, errors))
      .then((value) => {
        if (!recursive || !isPlainObject(value)) { // only iterate though actual objects
          if (errors.length) throw errors[0];
          return value;
        }

        originalValue = originalValue || value;

        const validations = this._nodes.map((key) => {
          const path = makePath`${opts.path}.${key}`;
          const field = this.fields[key];

          const innerOptions = {
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

            if (field.validate) { return field.validate(value[key], innerOptions); }
          }

          return true;
        });

        return runValidations({
          validations,
          value,
          errors,
          abortEarly,
          sync,
          path: opts.path,
          sort: sortByKeyOrder(this.fields),
        });
      });
  },

  concat(schema) {
    const next = MixedSchema.prototype.concat.call(this, schema);

    next._nodes = sortFields(next.fields, next._excludedEdges);

    return next;
  },

  shape(schema, excludes = []) {
    const next = this.clone();
    const fields = Object.assign(next.fields, schema);

    if (!isArray(excludes[0])) { excludes = [excludes]; }

    next.fields = fields;

    if (excludes.length) {
      const keys = excludes.map(([first, second]) => `${first}-${second}`);

      next._excludedEdges = next._excludedEdges.concat(keys);
    }

    next._nodes = sortFields(fields, next._excludedEdges);

    return next;
  },

  from(from, to, alias) {
    const fromGetter = getter(from, true);

    return this.transform((obj) => {
      let newObj = obj;

      if (obj == null) { return obj; }

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

    const next = this.test({
      name: 'noUnknown',
      exclusive: true,
      message,
      test(value) {
        return (
          value == null ||
          !noAllow ||
          unknown(this.schema, value).length === 0
        );
      },
    });

    if (noAllow) { next._options.stripUnknown = true; }

    return next;
  },

  transformKeys(fn) {
    return this.transform(obj => obj &&
      mapKeys(obj, (_, key) => fn(key)),
    );
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
