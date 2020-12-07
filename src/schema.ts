// @ts-ignore
import cloneDeep from 'nanoclone';

import { mixed as locale, string } from './locale';
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
import toArray from './util/toArray';
import {
  ValidateOptions,
  TransformFunction,
  Message,
  Callback,
  InternalOptions,
  Maybe,
  ExtraParams,
  Preserve,
} from './types';

import ValidationError from './ValidationError';
import ReferenceSet from './util/ReferenceSet';
import Reference from './Reference';
import isAbsent from './util/isAbsent';
import { Config, Defined, ResolveFlags } from './util/types';

// const UNSET = 'unset' as const;

// type hmm = HasFlag<'' | 'd', 'd'>
export { Config };

export type SchemaSpec<TDefault> = {
  nullable: boolean;
  optional: boolean;
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

export type AnySchema<TType = any, TOut = any, C = any> = BaseSchema<
  TType,
  TOut,
  any
>;

export interface CastOptions<C = {}> {
  parent?: any;
  context?: C;
  assert?: boolean;
  stripUnknown?: boolean;
  // XXX: should be private?
  path?: string;
}

export interface SchemaRefDescription {
  type: 'ref';
  key: string;
}

export type Cast<T, D> = T extends undefined
  ? // if default is undefined then it won't affect T
    D extends undefined
    ? T
    : Defined<T>
  : T;

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
  nullable: boolean;
  optional: boolean;
  tests: Array<{ name?: string; params: ExtraParams | undefined }>;
}

export default abstract class BaseSchema<
  TType = any,
  TOut = any,
  TConfig extends Config<any, any> = Config
> {
  readonly type: string;

  readonly __type!: TType;
  readonly __outputType!: TOut;
  readonly __out!: ResolveFlags<TOut, TConfig['flags']>;

  readonly __isYupSchema__!: boolean;

  readonly deps: readonly string[] = [];

  tests: Test[];
  transforms: TransformFunction<AnySchema>[];

  private conditions: Condition[] = [];

  private _mutate?: boolean;

  private internalTests: Record<string, Test | null> = {};

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
      label: undefined,
      meta: undefined,
      nullable: false,
      optional: true,
      // presence: 'nonnullable',
      ...options?.spec,
    };

    this.withMutation((s) => {
      s.nonNullable();
    });
  }

  // TODO: remove
  get _type() {
    return this.type;
  }

  protected _typeCheck(_value: any): _value is NonNullable<TType> {
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

    next._whitelist = this._whitelist.clone();
    next._blacklist = this._blacklist.clone();
    next.internalTests = { ...this.internalTests };
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
  meta(obj: Record<string, unknown>): void;
  meta(...args: [Record<string, unknown>?]) {
    if (args.length === 0) return this.spec.meta;

    let next = this.clone();
    next.spec.meta = Object.assign(next.spec.meta || {}, args[0]);
    return next;
  }

  // withContext<C extends AnyObject>(): BaseSchema<
  //   TType,
  //   C,
  //   TOut
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
    combined.internalTests = {
      ...base.internalTests,
      ...combined.internalTests,
    };
    // combined._typeError ||= base._typeError;
    // combined._whitelistError ||= base._whitelistError;
    // combined._blacklistError ||= base._blacklistError;

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

  isType(v: unknown): v is TType {
    if (v == null) {
      if (this.spec.nullable && v === null) return true;
      if (this.spec.optional && v === undefined) return true;
      return false;
    }

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
  cast(
    value: any,
    options: CastOptions<TConfig['context']> = {},
  ): this['__out'] {
    let resolvedSchema = this.resolve({
      value,
      ...options,
      // parent: options.parent,
      // context: options.context,
    });

    let result = resolvedSchema._cast(value, options);

    if (options.assert !== false && !resolvedSchema.isType(result)) {
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

  protected _cast(
    rawValue: any,
    _options: CastOptions<TConfig['context']>,
  ): any {
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
    options: InternalOptions<TConfig['context']> = {},
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
    for (let test of Object.values(this.internalTests)) {
      if (test) initialTests.push(test);
    }

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
            tests: this.tests,
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

  // validate<U extends TType>(value: U, options?: ValidateOptions<TConfig['context']>): Promise<U>;
  validate(
    value: any,
    options?: ValidateOptions<TConfig['context']>,
  ): Promise<this['__out']>;
  validate(
    value: any,
    options?: ValidateOptions<TConfig['context']>,
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

  // validateSync<U extends TType>(value: U, options?: ValidateOptions<TConfig['context']>): U;
  validateSync(
    value: any,
    options?: ValidateOptions<TConfig['context']>,
  ): this['__out'];
  validateSync(
    value: any,
    options?: ValidateOptions<TConfig['context']>,
  ): this['__out'] {
    let schema = this.resolve({ ...options, value });
    let result: any;

    schema._validate(value, { ...options, sync: true }, (err, value) => {
      if (err) throw err;
      result = value;
    });

    return result;
  }

  isValid(
    value: any,
    options?: ValidateOptions<TConfig['context']>,
  ): Promise<boolean> {
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
    options?: ValidateOptions<TConfig['context']>,
  ): value is this['__out'] {
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

  getDefault(
    options?: ResolveOptions,
    // this isn't the same as TOut but close
  ): TType {
    //Preserve<TConfig['flags'], 'd'> extends never ? TType : Defined<TType> {
    let schema = this.resolve(options || {});
    return schema._getDefault();
  }

  default<TNext extends Maybe<TType>>(def: TNext | (() => TNext)): any {
    if (arguments.length === 0) {
      return this._getDefault();
    }

    let next = this.clone({ default: def });

    return next as any;
  }

  strict(isStrict = true) {
    return this.clone({ strict: isStrict });
  }

  protected _isPresent(value: any) {
    return value != null;
  }

  protected nullability(nullable: boolean, message?: Message<any>) {
    const next = this.clone({ nullable });
    next.internalTests['nullable'] = createValidation({
      message,
      name: 'nullable',
      test(value) {
        return value === null ? this.schema.spec.nullable : true;
      },
    });
    return next;
  }

  protected optionality(optional: boolean, message?: Message<any>) {
    const next = this.clone({ optional });
    next.internalTests['optionality'] = createValidation({
      message,
      name: 'optionality',
      test(value) {
        return value === undefined ? this.schema.spec.optional : true;
      },
    });
    return next;
  }

  optional(): any {
    return this.optionality(true);
  }
  defined(message = locale.defined): any {
    return this.optionality(false, message);
  }

  // nullable(message?: Message): any
  // nullable(nullable: true): any
  // nullable(nullable: false, message?: Message): any
  nullable(): any {
    return this.nullability(true);
  }
  nonNullable(message = locale.required): any {
    return this.nullability(false, message);
  }

  required(message: Message<any> = locale.required): any {
    return this.clone().withMutation((next) =>
      next
        .nonNullable(message)
        .defined(message)
        .test({
          message,
          name: 'required',
          exclusive: true,
          test(value: any) {
            return this.schema._isPresent(value);
          },
        }),
    ) as any;
  }

  notRequired(): any {
    return this.clone().withMutation((next) => {
      next.tests = next.tests.filter(
        (test) => test.OPTIONS.name !== 'required',
      );
      return next.nullable().optional();
    });
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
  test(options: TestConfig<TType, TConfig['context']>): this;
  test(test: TestFunction<TType, TConfig['context']>): this;
  test(name: string, test: TestFunction<TType, TConfig['context']>): this;
  test(
    name: string,
    message: Message,
    test: TestFunction<TType, TConfig['context']>,
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

    next.internalTests['typeError'] = createValidation({
      message,
      name: 'typeError',
      test(value) {
        if (!isAbsent(value) && !this.schema._typeCheck(value))
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

  oneOf<U extends TType>(
    enums: Array<Maybe<U> | Reference>,
    message = locale.oneOf,
  ): this {
    var next = this.clone();

    enums.forEach((val) => {
      next._whitelist.add(val);
      next._blacklist.delete(val);
    });

    next.internalTests['whiteList'] = createValidation({
      message,
      name: 'oneOf',
      test(value) {
        if (value === undefined) return true;
        let valids = this.schema._whitelist;

        return valids.has(value, this.resolve)
          ? true
          : this.createError({
              params: {
                values: valids.toArray().join(', '),
              },
            });
      },
    });

    return next;
  }

  notOneOf<U extends TType>(
    enums: Array<Maybe<U> | Reference>,
    message = locale.notOneOf,
  ): this {
    var next = this.clone();
    enums.forEach((val) => {
      next._blacklist.add(val);
      next._whitelist.delete(val);
    });

    next.internalTests['blacklist'] = createValidation({
      message,
      name: 'notOneOf',
      test(value) {
        let invalids = this.schema._blacklist;
        if (invalids.has(value, this.resolve))
          return this.createError({
            params: {
              values: invalids.toArray().join(', '),
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
    const { label, meta, optional, nullable } = next.spec;
    const description: SchemaDescription = {
      meta,
      label,
      optional,
      nullable,
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

export default interface BaseSchema<
  TType = any,
  TOut = any,
  TConfig extends Config<any, any> = Config
> {
  validateAt(
    path: string,
    value: any,
    options?: ValidateOptions<TConfig['context']>,
  ): Promise<any>;
  validateSyncAt(
    path: string,
    value: any,
    options?: ValidateOptions<TConfig['context']>,
  ): any;
  equals: BaseSchema['oneOf'];
  is: BaseSchema['oneOf'];
  not: BaseSchema['notOneOf'];
  nope: BaseSchema['notOneOf'];
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
