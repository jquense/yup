// @ts-ignore
import cloneDeep from 'nanoclone';

import { mixed as locale } from './locale';
import Condition, { ConditionOptions, ResolveOptions } from './Condition';
import runTests from './util/runTests';
import createValidation, {
  TestFunction,
  Test,
  TestConfig,
} from './util/createValidation';
import printValue from './util/printValue';
import Ref from './Reference';
import { getIn } from './util/reach';
import {
  ValidateOptions,
  TransformFunction,
  Message,
  Callback,
  InternalOptions,
  Maybe,
  ExtraParams,
  AnyObject,
} from './types';

import ValidationError from './ValidationError';
import type { Asserts, Thunk } from './util/types';
import ReferenceSet from './util/ReferenceSet';
import Reference from './Reference';
import toArray from './util/toArray';

// const UNSET = 'unset' as const;

export type SchemaSpec<TDefault> = {
  nullable: boolean;
  presence: 'required' | 'defined' | 'optional';
  default?: TDefault | (() => TDefault);
  abortEarly?: boolean;
  strip?: boolean;
  strict?: boolean;
  recursive?: boolean;
  label?: string | undefined;
  meta?: any;
};

export type SchemaOptions<TDefault> = {
  type?: string;
  spec?: SchemaSpec<TDefault>;
};

export type AnySchema<Type = any, TContext = any, TOut = any> = BaseSchema<
  Type,
  TContext,
  TOut
>;

export interface CastOptions<TContext = {}> {
  parent?: any;
  context?: TContext;
  assert?: boolean;
  stripUnknown?: boolean;
  // XXX: should be private?
  path?: string;
}

export interface SchemaRefDescription {
  type: 'ref';
  key: string;
}

export interface SchemaInnerTypeDescription extends SchemaDescription {
  innerType?: SchemaFieldDescription;
}

export interface SchemaObjectDescription extends SchemaDescription {
  fields: Record<string, SchemaFieldDescription>;
}

export type SchemaFieldDescription =
  | SchemaDescription
  | SchemaRefDescription
  | SchemaObjectDescription
  | SchemaInnerTypeDescription;

export interface SchemaDescription {
  type: string;
  label?: string;
  meta: object;
  oneOf: unknown[];
  notOneOf: unknown[];
  tests: Array<{ name?: string; params: ExtraParams | undefined }>;
}

export default abstract class BaseSchema<
  TCast = any,
  TContext = AnyObject,
  TOutput = any
> {
  readonly type: string;

  readonly __inputType!: TCast;
  readonly __outputType!: TOutput;

  readonly __isYupSchema__!: boolean;

  readonly deps: readonly string[] = [];

  tests: Test[];
  transforms: TransformFunction<AnySchema>[];

  private conditions: Condition[] = [];

  private _mutate?: boolean;
  private _typeError?: Test;
  private _whitelistError?: Test;
  private _blacklistError?: Test;

  protected _whitelist = new ReferenceSet();
  protected _blacklist = new ReferenceSet();

  protected exclusiveTests: Record<string, boolean> = Object.create(null);

  spec: SchemaSpec<any>;

  constructor(options?: SchemaOptions<any>) {
    this.tests = [];
    this.transforms = [];

    this.withMutation(() => {
      this.typeError(locale.notType);
    });

    this.type = options?.type || ('mixed' as const);

    this.spec = {
      strip: false,
      strict: false,
      abortEarly: true,
      recursive: true,
      nullable: false,
      presence: 'optional',
      ...options?.spec,
    };
  }

  // TODO: remove
  get _type() {
    return this.type;
  }

  protected _typeCheck(_value: any): _value is NonNullable<TCast> {
    return true;
  }

  clone(spec?: Partial<SchemaSpec<any>>): this {
    if (this._mutate) {
      if (spec) Object.assign(this.spec, spec);
      return this;
    }

    // if the nested value is a schema we can skip cloning, since
    // they are already immutable
    const next: AnySchema = Object.create(Object.getPrototypeOf(this));

    // @ts-expect-error this is readonly
    next.type = this.type;

    next._typeError = this._typeError;
    next._whitelistError = this._whitelistError;
    next._blacklistError = this._blacklistError;
    next._whitelist = this._whitelist.clone();
    next._blacklist = this._blacklist.clone();
    next.exclusiveTests = { ...this.exclusiveTests };

    // @ts-expect-error this is readonly
    next.deps = [...this.deps];
    next.conditions = [...this.conditions];
    next.tests = [...this.tests];
    next.transforms = [...this.transforms];
    next.spec = cloneDeep({ ...this.spec, ...spec });

    return next as this;
  }

  label(label: string) {
    var next = this.clone();
    next.spec.label = label;
    return next;
  }

  meta(): Record<string, unknown> | undefined;
  meta(obj: Record<string, unknown>): this;
  meta(...args: [Record<string, unknown>?]) {
    if (args.length === 0) return this.spec.meta;

    let next = this.clone();
    next.spec.meta = Object.assign(next.spec.meta || {}, args[0]);
    return next;
  }

  // withContext<TContext extends AnyObject>(): BaseSchema<
  //   TCast,
  //   TContext,
  //   TOutput
  // > {
  //   return this as any;
  // }

  withMutation<T>(fn: (schema: this) => T): T {
    let before = this._mutate;
    this._mutate = true;
    let result = fn(this);
    this._mutate = before;
    return result;
  }

  concat(schema: this): this;
  concat(schema: AnySchema): AnySchema;
  concat(schema: AnySchema): AnySchema {
    if (!schema || schema === this) return this;

    if (schema.type !== this.type && this.type !== 'mixed')
      throw new TypeError(
        `You cannot \`concat()\` schema's of different types: ${this.type} and ${schema.type}`,
      );

    let base = this;
    let combined = schema.clone();

    const mergedSpec = { ...base.spec, ...combined.spec };

    // if (combined.spec.nullable === UNSET)
    //   mergedSpec.nullable = base.spec.nullable;

    // if (combined.spec.presence === UNSET)
    //   mergedSpec.presence = base.spec.presence;

    combined.spec = mergedSpec;

    combined._typeError ||= base._typeError;
    combined._whitelistError ||= base._whitelistError;
    combined._blacklistError ||= base._blacklistError;

    // manually merge the blacklist/whitelist (the other `schema` takes
    // precedence in case of conflicts)
    combined._whitelist = base._whitelist.merge(
      schema._whitelist,
      schema._blacklist,
    );
    combined._blacklist = base._blacklist.merge(
      schema._blacklist,
      schema._whitelist,
    );

    // start with the current tests
    combined.tests = base.tests;
    combined.exclusiveTests = base.exclusiveTests;

    // manually add the new tests to ensure
    // the deduping logic is consistent
    combined.withMutation((next) => {
      schema.tests.forEach((fn) => {
        next.test(fn.OPTIONS);
      });
    });

    return combined as any;
  }

  isType(v: any) {
    if (this.spec.nullable && v === null) return true;
    return this._typeCheck(v);
  }

  resolve(options: ResolveOptions) {
    let schema = this;

    if (schema.conditions.length) {
      let conditions = schema.conditions;

      schema = schema.clone();
      schema.conditions = [];
      schema = conditions.reduce(
        (schema, condition) => condition.resolve(schema, options),
        schema,
      ) as this;

      schema = schema.resolve(options);
    }

    return schema;
  }

  /**
   *
   * @param {*} value
   * @param {Object} options
   * @param {*=} options.parent
   * @param {*=} options.context
   */
  cast(value: any, options: CastOptions<TContext> = {}): TCast {
    let resolvedSchema = this.resolve({
      value,
      ...options,
      // parent: options.parent,
      // context: options.context,
    });

    let result = resolvedSchema._cast(value, options);

    if (
      value !== undefined &&
      options.assert !== false &&
      resolvedSchema.isType(result) !== true
    ) {
      let formattedValue = printValue(value);
      let formattedResult = printValue(result);
      throw new TypeError(
        `The value of ${
          options.path || 'field'
        } could not be cast to a value ` +
          `that satisfies the schema type: "${resolvedSchema._type}". \n\n` +
          `attempted value: ${formattedValue} \n` +
          (formattedResult !== formattedValue
            ? `result of cast: ${formattedResult}`
            : ''),
      );
    }

    return result;
  }

  protected _cast(rawValue: any, _options: CastOptions<TContext>): any {
    let value =
      rawValue === undefined
        ? rawValue
        : this.transforms.reduce(
            (value, fn) => fn.call(this, value, rawValue, this),
            rawValue,
          );

    if (value === undefined) {
      value = this.getDefault();
    }

    return value;
  }

  protected _validate(
    _value: any,
    options: InternalOptions<TContext> = {},
    cb: Callback,
  ): void {
    let {
      sync,
      path,
      from = [],
      originalValue = _value,
      strict = this.spec.strict,
      abortEarly = this.spec.abortEarly,
    } = options;

    let value = _value;
    if (!strict) {
      // this._validating = true;
      value = this._cast(value, { assert: false, ...options });
      // this._validating = false;
    }
    // value is cast, we can check if it meets type requirements
    let args = {
      value,
      path,
      options,
      originalValue,
      schema: this,
      label: this.spec.label,
      sync,
      from,
    };

    let initialTests = [];

    if (this._typeError) initialTests.push(this._typeError);

    let finalTests = [];
    if (this._whitelistError) finalTests.push(this._whitelistError);
    if (this._blacklistError) finalTests.push(this._blacklistError);    

    runTests(
      {
        args,
        value,
        path,
        sync,
        tests: initialTests,
        endEarly: abortEarly,
      },
      (err) => {
        if (err) return void cb(err, value);

        runTests(
          {
            tests: this.tests.concat(finalTests),
            args,
            path,
            sync,
            value,
            endEarly: abortEarly,
          },
          cb,
        );
      },
    );
  }

  validate(
    value: any,
    options?: ValidateOptions<TContext>,
  ): Promise<this['__outputType']>;
  validate(
    value: any,
    options?: ValidateOptions<TContext>,
    maybeCb?: Callback,
  ) {
    let schema = this.resolve({ ...options, value });

    // callback case is for nested validations
    return typeof maybeCb === 'function'
      ? schema._validate(value, options, maybeCb)
      : new Promise((resolve, reject) =>
          schema._validate(value, options, (err, value) => {
            if (err) reject(err);
            else resolve(value);
          }),
        );
  }

  validateSync(
    value: any,
    options?: ValidateOptions<TContext>,
  ): this['__outputType'] {
    let schema = this.resolve({ ...options, value });
    let result: any;

    schema._validate(value, { ...options, sync: true }, (err, value) => {
      if (err) throw err;
      result = value;
    });

    return result;
  }

  isValid(value: any, options?: ValidateOptions<TContext>): Promise<boolean> {
    return this.validate(value, options).then(
      () => true,
      (err) => {
        if (ValidationError.isError(err)) return false;
        throw err;
      },
    );
  }

  isValidSync(
    value: any,
    options?: ValidateOptions<TContext>,
  ): value is Asserts<this> {
    try {
      this.validateSync(value, options);
      return true;
    } catch (err) {
      if (ValidationError.isError(err)) return false;
      throw err;
    }
  }

  protected _getDefault() {
    let defaultValue = this.spec.default;

    if (defaultValue == null) {
      return defaultValue;
    }
    return typeof defaultValue === 'function'
      ? defaultValue.call(this)
      : cloneDeep(defaultValue);
  }

  getDefault(options?: ResolveOptions): TCast {
    let schema = this.resolve(options || {});
    return schema._getDefault();
  }

  default(def: Thunk<any>): any {
    if (arguments.length === 0) {
      return this._getDefault();
    }

    let next = this.clone({ default: def });

    return next as any;
  }

  strict(isStrict = true) {
    var next = this.clone();
    next.spec.strict = isStrict;
    return next;
  }

  protected _isPresent(value: unknown) {
    return value != null;
  }

  defined(message = locale.defined): any {
    return this.test({
      message,
      name: 'defined',
      exclusive: true,
      test(value) {
        return value !== undefined;
      },
    });
  }

  required(message = locale.required): any {
    return this.clone({ presence: 'required' }).withMutation((s) =>
      s.test({
        message,
        name: 'required',
        exclusive: true,
        test(value) {
          return this.schema._isPresent(value);
        },
      }),
    ) as any;
  }

  notRequired(): any {
    var next = this.clone({ presence: 'optional' });
    next.tests = next.tests.filter((test) => test.OPTIONS.name !== 'required');
    return next as any;
  }

  nullable(isNullable?: true): any;
  nullable(isNullable: false): any;
  nullable(isNullable = true): any {
    var next = this.clone({
      nullable: isNullable !== false,
    });

    return next as any;
  }

  transform(fn: TransformFunction<this>) {
    var next = this.clone();
    next.transforms.push(fn as TransformFunction<any>);
    return next;
  }

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
  test(options: TestConfig<TCast, TContext>): this;
  test(test: TestFunction<TCast, TContext>): this;
  test(name: string, test: TestFunction<TCast, TContext>): this;
  test(
    name: string,
    message: Message,
    test: TestFunction<TCast, TContext>,
  ): this;
  test(...args: any[]) {
    let opts: TestConfig;

    if (args.length === 1) {
      if (typeof args[0] === 'function') {
        opts = { test: args[0] };
      } else {
        opts = args[0];
      }
    } else if (args.length === 2) {
      opts = { name: args[0], test: args[1] };
    } else {
      opts = { name: args[0], message: args[1], test: args[2] };
    }

    if (opts.message === undefined) opts.message = locale.default;

    if (typeof opts.test !== 'function')
      throw new TypeError('`test` is a required parameters');

    let next = this.clone();
    let validate = createValidation(opts);

    let isExclusive =
      opts.exclusive || (opts.name && next.exclusiveTests[opts.name] === true);

    if (opts.exclusive) {
      if (!opts.name)
        throw new TypeError(
          'Exclusive tests must provide a unique `name` identifying the test',
        );
    }

    if (opts.name) next.exclusiveTests[opts.name] = !!opts.exclusive;

    next.tests = next.tests.filter((fn) => {
      if (fn.OPTIONS.name === opts.name) {
        if (isExclusive) return false;
        if (fn.OPTIONS.test === validate.OPTIONS.test) return false;
      }
      return true;
    });

    next.tests.push(validate);

    return next;
  }

  when(options: ConditionOptions<this>): this;
  when(keys: string | string[], options: ConditionOptions<this>): this;
  when(
    keys: string | string[] | ConditionOptions<this>,
    options?: ConditionOptions<this>,
  ) {
    if (!Array.isArray(keys) && typeof keys !== 'string') {
      options = keys;
      keys = '.';
    }

    let next = this.clone();
    let deps = toArray(keys).map((key) => new Ref(key));

    deps.forEach((dep) => {
      // @ts-ignore
      if (dep.isSibling) next.deps.push(dep.key);
    });

    next.conditions.push(new Condition(deps, options!) as Condition);

    return next;
  }

  typeError(message: Message) {
    var next = this.clone();

    next._typeError = createValidation({
      message,
      name: 'typeError',
      test(value) {
        if (value !== undefined && !this.schema.isType(value))
          return this.createError({
            params: {
              type: this.schema._type,
            },
          });
        return true;
      },
    });
    return next;
  }

  oneOf<U extends TCast>(
    enums: Array<Maybe<U> | Reference> | Reference,
    message = locale.oneOf,
  ): this {
    var next = this.clone();

    (Ref.isRef(enums) ? [enums] : enums).forEach((val) => {
      next._whitelist.add(val);
      next._blacklist.delete(val);
    });

    next._whitelistError = createValidation({
      message,
      name: 'oneOf',
      test(value) {
        if (value === undefined) return true;
        let valids = this.schema._whitelist;
        let resolved = valids.resolveAll(this.resolve);

        return resolved.includes(value)
          ? true
          : this.createError({
              params: {
                values: valids.toArray().join(', '),
                resolved
              },
            });
      },
    });

    return next;
  }

  notOneOf<U extends TCast>(
    enums: Array<Maybe<U> | Reference> | Reference,
    message = locale.notOneOf,
  ): this {
    var next = this.clone();
    (Ref.isRef(enums) ? [enums] : enums).forEach((val) => {
      next._blacklist.add(val);
      next._whitelist.delete(val);
    });

    next._blacklistError = createValidation({
      message,
      name: 'notOneOf',
      test(value) {
        let invalids = this.schema._blacklist;
        let resolved = invalids.resolveAll(this.resolve);
        if (resolved.includes(value))
          return this.createError({
            params: {
              values: invalids.toArray().join(', '),
              resolved
            },
          });
        return true;
      },
    });

    return next;
  }

  strip(strip = true) {
    let next = this.clone();
    next.spec.strip = strip;
    return next;
  }

  describe() {
    const next = this.clone();
    const { label, meta } = next.spec;
    const description: SchemaDescription = {
      meta,
      label,
      type: next.type,
      oneOf: next._whitelist.describe(),
      notOneOf: next._blacklist.describe(),
      tests: next.tests
        .map((fn) => ({ name: fn.OPTIONS.name, params: fn.OPTIONS.params }))
        .filter(
          (n, idx, list) => list.findIndex((c) => c.name === n.name) === idx,
        ),
    };

    return description;
  }
}

export default interface BaseSchema<TCast, TContext, TOutput> {
  validateAt(
    path: string,
    value: any,
    options?: ValidateOptions<TContext>,
  ): Promise<TOutput>;
  validateSyncAt(
    path: string,
    value: any,
    options?: ValidateOptions<TContext>,
  ): TOutput;
  equals: BaseSchema['oneOf'];
  is: BaseSchema['oneOf'];
  not: BaseSchema['notOneOf'];
  nope: BaseSchema['notOneOf'];
  optional(): any;
}

// @ts-expect-error
BaseSchema.prototype.__isYupSchema__ = true;

for (const method of ['validate', 'validateSync'])
  BaseSchema.prototype[
    `${method}At` as 'validateAt' | 'validateSyncAt'
  ] = function (path: string, value: any, options: ValidateOptions = {}) {
    const { parent, parentPath, schema } = getIn(
      this,
      path,
      value,
      options.context,
    );
    return schema[method](parent && parent[parentPath], {
      ...options,
      parent,
      path,
    });
  };

for (const alias of ['equals', 'is'] as const)
  BaseSchema.prototype[alias] = BaseSchema.prototype.oneOf;

for (const alias of ['not', 'nope'] as const)
  BaseSchema.prototype[alias] = BaseSchema.prototype.notOneOf;

BaseSchema.prototype.optional = BaseSchema.prototype.notRequired;
