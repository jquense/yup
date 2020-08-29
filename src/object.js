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
import runTests from './util/runTests';

let isObject = (obj) =>
  Object.prototype.toString.call(obj) === '[object Object]';

function unknown(ctx, value) {
  let known = Object.keys(ctx.fields);
  return Object.keys(value).filter((key) => known.indexOf(key) === -1);
}

export default class ObjectSchema extends MixedSchema {
  static create(spec) {
    return new ObjectSchema(spec);
  }
  constructor(spec) {
    super({
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

    this.fields = Object.create(null);

    this._sortErrors = sortByKeyOrder([]);

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

  _typeCheck(value) {
    return isObject(value) || typeof value === 'function';
  }

  _cast(_value, options = {}) {
    let value = super._cast(_value);

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
    for (const prop of props) {
      let field = fields[prop];
      let exists = has(value, prop);

      if (field) {
        let fieldValue;
        let strict = field._options && field._options.strict;

        // safe to mutate since this is fired in sequence
        innerOptions.path = (options.path ? `${options.path}.` : '') + prop;
        innerOptions.value = value[prop];

        field = field.resolve(innerOptions);

        if (field._strip === true) {
          isChanged = isChanged || prop in value;
          continue;
        }

        fieldValue =
          !options.__validating || !strict
            ? field.cast(value[prop], innerOptions)
            : value[prop];

        if (fieldValue !== undefined) {
          intermediateValue[prop] = fieldValue;
        }
      } else if (exists && !strip) {
        intermediateValue[prop] = value[prop];
      }

      if (intermediateValue[prop] !== value[prop]) {
        isChanged = true;
      }
    }

    return isChanged ? intermediateValue : value;
  }

  /**
   * @typedef {Object} Ancestor
   * @property {Object} schema - a string property of SpecialType
   * @property {*} value - a number property of SpecialType
   */

  /**
   *
   * @param {*} _value
   * @param {Object}       opts
   * @param {string=}      opts.path
   * @param {*=}           opts.parent
   * @param {Object=}      opts.context
   * @param {boolean=}     opts.sync
   * @param {boolean=}     opts.stripUnknown
   * @param {boolean=}     opts.strict
   * @param {boolean=}     opts.recursive
   * @param {boolean=}     opts.abortEarly
   * @param {boolean=}     opts.__validating
   * @param {Object=}      opts.originalValue
   * @param {Ancestor[]=}  opts.from
   * @param {Object}       [opts.from]
   * @param {Function}     callback
   */
  _validate(_value, opts = {}, callback) {
    let errors = [];
    let {
      sync,
      from = [],
      originalValue = _value,
      abortEarly = this._options.abortEarly,
      recursive = this._options.recursive,
    } = opts;

    from = [{ schema: this, value: originalValue }, ...from];

    // this flag is needed for handling `strict` correctly in the context of
    // validation vs just casting. e.g strict() on a field is only used when validating
    opts.__validating = true;
    opts.originalValue = originalValue;
    opts.from = from;

    super._validate(_value, opts, (err, value) => {
      if (err) {
        if (abortEarly) return void callback(err);

        errors.push(err);
        value = err.value;
      }

      if (!recursive || !isObject(value)) {
        callback(errors[0] || null, value);
        return;
      }

      originalValue = originalValue || value;

      let tests = this._nodes.map((key) => (_, cb) => {
        let path =
          key.indexOf('.') === -1
            ? (opts.path ? `${opts.path}.` : '') + key
            : `${opts.path || ''}["${key}"]`;

        let field = this.fields[key];

        if (field && field.validate) {
          field.validate(
            value[key],
            {
              ...opts,
              path,
              from,
              // inner fields are always strict:
              // 1. this isn't strict so the casting will also have cast inner values
              // 2. this is strict in which case the nested values weren't cast either
              strict: true,
              parent: value,
              originalValue: originalValue[key],
            },
            cb,
          );
          return;
        }

        cb(null);
      });

      runTests(
        {
          sync,
          tests,
          value,
          errors,
          endEarly: abortEarly,
          sort: this._sortErrors,
          path: opts.path,
        },
        callback,
      );
    });
  }

  concat(schema) {
    var next = super.concat(schema);

    next._nodes = sortFields(next.fields, next._excludedEdges);

    return next;
  }

  shape(schema, excludes = []) {
    let next = this.clone();
    let fields = Object.assign(next.fields, schema);

    next.fields = fields;
    next._sortErrors = sortByKeyOrder(Object.keys(fields));

    if (excludes.length) {
      if (!Array.isArray(excludes[0])) excludes = [excludes];

      let keys = excludes.map(([first, second]) => `${first}-${second}`);

      next._excludedEdges = next._excludedEdges.concat(keys);
    }

    next._nodes = sortFields(fields, next._excludedEdges);

    return next;
  }

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
  }

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
  }

  unknown(allow = true, message = locale.noUnknown) {
    return this.noUnknown(!allow, message);
  }

  transformKeys(fn) {
    return this.transform((obj) => obj && mapKeys(obj, (_, key) => fn(key)));
  }

  camelCase() {
    return this.transformKeys(camelCase);
  }

  snakeCase() {
    return this.transformKeys(snakeCase);
  }

  constantCase() {
    return this.transformKeys((key) => snakeCase(key).toUpperCase());
  }

  describe() {
    let base = super.describe();
    base.fields = mapValues(this.fields, (value) => value.describe());
    return base;
  }
}
