/* eslint-disable no-param-reassign */
import typeName from 'type-name';
import isArray from 'lodash/isArray';

import inherits from './util/inherits';
import isAbsent from './util/isAbsent';
import isSchema from './util/isSchema';
import makePath from './util/makePath';
import MixedSchema from './mixed';
import { mixed, array as locale } from './locale';
import runValidations, { propagateErrors } from './util/runValidations';


const hasLength = value => !isAbsent(value) && value.length > 0;

export default function ArraySchema(type) {
  if (!(this instanceof ArraySchema)) { return new ArraySchema(type); }

  MixedSchema.call(this, { type: 'array' });

  // `undefined` specifically means uninitialized, as opposed to
  // "no subtype"
  this._subType = undefined;

  this.withMutation(() => {
    this.transform(function transform(values) {
      if (typeof values === 'string') {
        try {
          values = JSON.parse(values);
        } catch (err) { values = null; }
      }

      return this.isType(values) ? values : null;
    });

    if (type) { this.of(type); }
  });
}

inherits(ArraySchema, MixedSchema, {

  _typeCheck(v) {
    return isArray(v);
  },

  _cast(_value, _opts) {
    const value = MixedSchema.prototype._cast.call(this, _value, _opts);

    // should ignore nulls here
    if (!this._typeCheck(value) || !this._subType) { return value; }

    return value.map(v => this._subType.cast(v, _opts));
  },

  _validate(_value, options = {}) {
    const errors = [];
    const path = options.path;
    const subType = this._subType;
    const abortEarly = this._option('abortEarly', options);
    const recursive = this._option('recursive', options);
    const sync = this._option('sync', options);

    let originalValue = options.originalValue != null ?
      options.originalValue : _value;

    return MixedSchema.prototype._validate
      .call(this, _value, options)
      .catch(propagateErrors(abortEarly, errors))
      .then((value) => {
        if (!recursive || !subType || !this._typeCheck(value)) {
          if (errors.length) throw errors[0];
          return value;
        }

        originalValue = originalValue || value;

        const validations = value.map((item, idx) => {
          const formattedPath = makePath`${options.path}[${idx}]`;

          // object._validate note for isStrict explanation
          const innerOptions = {
            ...options,
            path: formattedPath,
            strict: true,
            parent: value,
            originalValue: originalValue[idx],
          };

          if (subType.validate) { return subType.validate(item, innerOptions); }

          return true;
        });

        return runValidations({
          path,
          value,
          errors,
          abortEarly,
          sync,
          validations,
        });
      });
  },

  of(schema) {
    const next = this.clone();

    if (schema !== false && !isSchema(schema)) {
      throw new TypeError(
        `${'`array.of()` sub-schema must be a valid yup schema, or `false` to negate a current sub-schema. ' +
        'not: '}${typeName(schema)}`,
      );
    }

    next._subType = schema;

    return next;
  },

  required(msg) {
    const next = MixedSchema.prototype.required.call(this, msg || mixed.required);

    return next.test(
      'required'
      , msg || mixed.required
      , hasLength,
    );
  },

  min(min, message) {
    message = message || locale.min;

    return this.test({
      message,
      name: 'min',
      exclusive: true,
      params: { min },
      test(value) {
        return isAbsent(value) || value.length >= this.resolve(min);
      },
    });
  },

  max(max, message) {
    message = message || locale.max;
    return this.test({
      message,
      name: 'max',
      exclusive: true,
      params: { max },
      test(value) {
        return isAbsent(value) || value.length <= this.resolve(max);
      },
    });
  },

  ensure() {
    return this
      .default(() => [])
      .transform(val => (val === null ? [] : [].concat(val)));
  },

  compact(rejector) {
    const reject = !rejector
      ? v => !!v
      : (v, i, a) => !rejector(v, i, a);

    return this.transform(values => (values != null ? values.filter(reject) : values));
  },
});
