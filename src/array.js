import inherits from './util/inherits';
import isAbsent from './util/isAbsent';
import isSchema from './util/isSchema';
import makePath from './util/makePath';
import printValue from './util/printValue';
import MixedSchema from './mixed';
import { array as locale } from './locale';
import runValidations, { propagateErrors } from './util/runValidations';

export default ArraySchema;

function ArraySchema(type) {
  if (!(this instanceof ArraySchema)) return new ArraySchema(type);

  MixedSchema.call(this, { type: 'array' });

  // `undefined` specifically means uninitialized, as opposed to
  // "no subtype"
  this._subType = undefined;
  this.innerType = undefined;

  this.withMutation(() => {
    this.transform(function (values) {
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
    if (!this._typeCheck(value) || !this.innerType) return value;

    let isChanged = false;
    const castArray = value.map((v, idx) => {
      const castElement = this.innerType.cast(v, {
        ..._opts,
        path: makePath`${_opts.path}[${idx}]`,
      });
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
    let innerType = this.innerType;
    let endEarly = this._option('abortEarly', options);
    let recursive = this._option('recursive', options);

    let originalValue =
      options.originalValue != null ? options.originalValue : _value;

    let from = [{ schema: this, value: originalValue }, ...(options.from || [])];

    const opts = { ...options, __validating: true, originalValue, from };

    return MixedSchema.prototype._validate
      .call(this, _value, options)
      .catch(propagateErrors(endEarly, errors))
      .then((value) => {
        if (!recursive || !innerType || !this._typeCheck(value)) {
          if (errors.length) throw errors[0];
          return value;
        }

        from = originalValue
          ? [...from]
          : [
              { schema: this, value: originalValue || value },
              ...(opts.from || []),
            ];

        originalValue = originalValue || value;

        // #950 Ensure that sparse array empty slots are validated
        let validations = new Array(value.length);
        for (let idx = 0; idx < value.length; idx++) {
          let item = value[idx];
          let path = makePath`${options.path}[${idx}]`;

          // object._validate note for isStrict explanation
          var innerOptions = {
            ...options,
            path,
            strict: true,
            from,
            parent: value,
            index: idx,
            originalValue: originalValue[idx],
          };

          validations[idx] = innerType.validate
            ? innerType.validate(item, innerOptions)
            : true;
        }

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

  _isPresent(value) {
    return (
      MixedSchema.prototype._isPresent.call(this, value) && value.length > 0
    );
  },

  of(schema) {
    var next = this.clone();

    if (schema !== false && !isSchema(schema))
      throw new TypeError(
        '`array.of()` sub-schema must be a valid yup schema, or `false` to negate a current sub-schema. ' +
          'not: ' +
          printValue(schema),
      );

    next._subType = schema;
    next.innerType = schema;

    return next;
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
    return this.default(() => []).transform((val, original) => {
      // We don't want to return `null` for nullable schema
      if (this._typeCheck(val)) return val;
      return original == null ? [] : [].concat(original);
    });
  },

  compact(rejector) {
    let reject = !rejector ? (v) => !!v : (v, i, a) => !rejector(v, i, a);

    return this.transform((values) =>
      values != null ? values.filter(reject) : values,
    );
  },

  describe() {
    let base = MixedSchema.prototype.describe.call(this);
    if (this.innerType) base.innerType = this.innerType.describe();
    return base;
  },
});
