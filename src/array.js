import inherits from './util/inherits';
import isAbsent from './util/isAbsent';
import isSchema from './util/isSchema';
import printValue from './util/printValue';
import MixedSchema from './mixed';
import { array as locale } from './locale';
import runTests from './util/runTests';

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
        path: `${_opts.path || ''}[${idx}]`,
      });
      if (castElement !== v) {
        isChanged = true;
      }

      return castElement;
    });

    return isChanged ? castArray : value;
  },

  _validate(_value, options = {}, callback) {
    let errors = [];
    let sync = options.sync;
    let path = options.path;
    let innerType = this.innerType;
    let endEarly = this._option('abortEarly', options);
    let recursive = this._option('recursive', options);

    let originalValue =
      options.originalValue != null ? options.originalValue : _value;

    MixedSchema.prototype._validate.call(
      this,
      _value,
      options,
      (err, value) => {
        if (err) {
          if (endEarly) return void callback(err);
          errors.push(err);
          value = err.value;
        }

        if (!recursive || !innerType || !this._typeCheck(value)) {
          callback(errors[0] || null, value);
          return;
        }

        originalValue = originalValue || value;

        // #950 Ensure that sparse array empty slots are validated
        let tests = new Array(value.length);
        for (let idx = 0; idx < value.length; idx++) {
          let item = value[idx];
          let path = `${options.path || ''}[${idx}]`;

          // object._validate note for isStrict explanation
          let innerOptions = {
            ...options,
            path,
            strict: true,
            parent: value,
            index: idx,
            originalValue: originalValue[idx],
          };

          tests[idx] = (_, cb) =>
            innerType.validate
              ? innerType.validate(item, innerOptions, cb)
              : cb(null);
        }

        runTests(
          {
            sync,
            path,
            value,
            errors,
            endEarly,
            tests,
          },
          callback,
        );
      },
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

  length(length, message) {
    message = message || locale.length;
    return this.test({
      message,
      name: 'length',
      exclusive: true,
      params: { length },
      test(value) {
        return isAbsent(value) || value.length === this.resolve(length);
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
