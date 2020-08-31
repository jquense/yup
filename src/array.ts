import isAbsent from './util/isAbsent';
import isSchema from './util/isSchema';
import printValue from './util/printValue';
import MixedSchema from './mixed';
import { array as locale } from './locale';
import runTests, { RunTest } from './util/runTests';
import Schema, { SchemaInnerTypeDescription } from './Schema';
import { InternalOptions, Callback, Message } from './types';
import ValidationError from './ValidationError';
import { Test } from './util/createValidation';
import Reference from './Reference';

type RefectorFn = (value: any, index: number, array: any[]) => boolean;

export function create<TInner extends Schema>(type: TInner) {
  return new ArraySchema(type);
}

export default class ArraySchema<T extends Schema> extends MixedSchema {
  private _subType?: T;

  innerType: T | undefined;

  constructor(type: T) {
    super({ type: 'array' });

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

  protected _typeCheck(v: any): v is any[] {
    return Array.isArray(v);
  }

  protected _cast(_value: any, _opts: InternalOptions) {
    const value = super._cast(_value, _opts);

    //should ignore nulls here
    if (!this._typeCheck(value) || !this.innerType) return value;

    let isChanged = false;
    const castArray = value.map((v, idx) => {
      const castElement = this.innerType!.cast(v, {
        ..._opts,
        path: `${_opts.path || ''}[${idx}]`,
      });
      if (castElement !== v) {
        isChanged = true;
      }

      return castElement;
    });

    return isChanged ? castArray : value;
  }

  protected _validate(
    _value: any,
    options: InternalOptions = {},
    callback: Callback,
  ) {
    let errors = [] as ValidationError[];
    let sync = options.sync;
    let path = options.path;
    let innerType = this.innerType;
    let endEarly = this._option('abortEarly', options);
    let recursive = this._option('recursive', options);

    let originalValue =
      options.originalValue != null ? options.originalValue : _value;

    super._validate(_value, options, (err, value) => {
      if (err) {
        if (!ValidationError.isError(err) || endEarly) {
          return void callback(err, value);
        }
        errors.push(err);
      }

      if (!recursive || !innerType || !this._typeCheck(value)) {
        callback(errors[0] || null, value);
        return;
      }

      originalValue = originalValue || value;

      // #950 Ensure that sparse array empty slots are validated
      let tests: RunTest[] = new Array(value.length);
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
          // XXX: ???
          // innerType!.validate
          //   ?
          innerType!.validate(item, innerOptions, cb);
        // : cb(null);
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
    });
  }

  _isPresent(value: any[]) {
    return super._isPresent(value) && value.length > 0;
  }

  of<TInner>(schema: TInner | false) {
    var next = this.clone();

    if (schema !== false && !isSchema(schema))
      throw new TypeError(
        '`array.of()` sub-schema must be a valid yup schema, or `false` to negate a current sub-schema. ' +
          'not: ' +
          printValue(schema),
      );
    // FIXME(ts):
    next._subType = schema as any;
    next.innerType = schema as any;

    return next;
  }

  min(min: number | Reference, message?: Message<{ min: number }>) {
    message = message || locale.min;

    return this.test({
      message,
      name: 'min',
      exclusive: true,
      params: { min },
      // FIXME(ts): Array<typeof T>
      test(value: any[]) {
        return isAbsent(value) || value.length >= this.resolve(min);
      },
    });
  }

  max(max: number | Reference, message?: Message<{ max: number }>) {
    message = message || locale.max;
    return this.test({
      message,
      name: 'max',
      exclusive: true,
      params: { max },
      // FIXME(ts): Array<typeof T>
      test(value: any[]) {
        return isAbsent(value) || value.length <= this.resolve(max);
      },
    });
  }

  ensure() {
    return this.default(() => []).transform((val, original) => {
      // We don't want to return `null` for nullable schema
      if (this._typeCheck(val)) return val;
      return original == null ? [] : [].concat(original);
    });
  }

  compact(rejector?: RefectorFn) {
    let reject: RefectorFn = !rejector
      ? (v) => !!v
      : (v, i, a) => !rejector(v, i, a);

    return this.transform((values: any[]) =>
      values != null ? values.filter(reject) : values,
    );
  }

  describe() {
    let base = super.describe() as SchemaInnerTypeDescription;
    if (this.innerType) base.innerType = this.innerType.describe();
    return base;
  }
}
