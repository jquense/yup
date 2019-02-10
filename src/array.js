import inherits from './util/inherits';
import isSchema from './util/isSchema';
import makePath from './util/makePath';
import printValue from './util/printValue';
import MixedSchema from './mixed';
import { array as locale } from './locale';
import runValidations, { propagateErrors } from './util/runValidations';

export default function ArraySchema(type) {
  if (!(this instanceof ArraySchema)) return new ArraySchema(type);

  MixedSchema.call(this, { type: 'array' });

  // `undefined` specifically means uninitialized, as opposed to
  // "no subtype"
  this._subType = undefined;

  this.withMutation(() => {
    this.transform(function(values) {
      if (typeof values === 'string')
        try {
          values = JSON.parse(values);
        } catch (err) {
          values = null;
        }

      return this.isType(values) ? values : null;
    });

    if (type) this.of(type);
  });
}

inherits(ArraySchema, MixedSchema, {
  _typeCheck(v) {
    return Array.isArray(v);
  },

  _cast(_value, _opts) {
    const value = MixedSchema.prototype._cast.call(this, _value, _opts);

    //should ignore nulls here
    if (!this._typeCheck(value) || !this._subType) return value;

    let isChanged = false;
    const castArray = value.map(v => {
      const castElement = this._subType.cast(v, _opts);
      if (castElement !== v) {
        isChanged = true;
      }

      return castElement;
    });

    return isChanged ? castArray : value;
  },

  _validate(_value, options = {}) {
    let errors = [];
    let sync = options.sync;
    let path = options.path;
    let subType = this._subType;
    let endEarly = this._option('abortEarly', options);
    let recursive = this._option('recursive', options);

    let originalValue =
      options.originalValue != null ? options.originalValue : _value;

    return MixedSchema.prototype._validate
      .call(this, _value, options)
      .catch(propagateErrors(endEarly, errors))
      .then(value => {
        if (!recursive || !subType || !this._typeCheck(value)) {
          if (errors.length) throw errors[0];
          return value;
        }

        originalValue = originalValue || value;

        let validations = value.map((item, idx) => {
          var path = makePath`${options.path}[${idx}]`;

          // object._validate note for isStrict explanation
          var innerOptions = {
            ...options,
            path,
            strict: true,
            parent: value,
            originalValue: originalValue[idx],
          };

          return subType.validate(item, innerOptions);
        });

        return runValidations({
          sync,
          path,
          value,
          errors,
          endEarly,
          validations,
        });
      });
  },

  _isFilled(value) {
    return value.length > 0;
  },

  of(schema) {
    if (schema !== false && !isSchema(schema))
      throw new TypeError(
        '`array.of()` sub-schema must be a valid yup schema, or `false` to negate a current sub-schema. ' +
          'not: ' +
          printValue(schema),
      );

    return this.clone(next => {
      next._subType = schema;
    });
  },

  min(min, message = locale.min) {
    return this.test({
      message,
      name: 'min',
      exclusive: true,
      params: { min },
      skipAbsent: true,
      test(value) {
        return value.length >= this.resolve(min);
      },
    });
  },

  max(max, message = locale.max) {
    return this.test({
      message,
      name: 'max',
      exclusive: true,
      params: { max },
      skipAbsent: true,
      test(value) {
        return value.length <= this.resolve(max);
      },
    });
  },

  ensure() {
    return this.clone(next => {
      next.default(() => []);
      next.transform(val => {
        if (this.isType(val)) return val;
        return val === null ? [] : [].concat(val);
      });
    });
  },

  compact(rejector) {
    let reject = !rejector ? v => !!v : (v, i, a) => !rejector(v, i, a);

    return this.transform(
      values => (values != null ? values.filter(reject) : values),
    );
  },

  describe() {
    let base = MixedSchema.prototype.describe.call(this);
    if (this._subType) base.innerType = this._subType.describe();
    return base;
  },
});
