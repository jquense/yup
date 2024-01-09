import { mixed as locale } from './locale';
import Condition, {
  ConditionBuilder,
  ConditionConfig,
  ResolveOptions,
} from './Condition';
import createValidation, {
  TestFunction,
  Test,
  TestConfig,
  NextCallback,
  PanicCallback,
  TestOptions,
} from './util/createValidation';
import printValue from './util/printValue';
import Ref from './Reference';
import { getIn } from './util/reach';
import {
  ValidateOptions,
  TransformFunction,
  Message,
  InternalOptions,
  ExtraParams,
  ISchema,
  NestedTestConfig,
  DefaultThunk,
} from './types';

import ValidationError from './ValidationError';
import ReferenceSet from './util/ReferenceSet';
import Reference from './Reference';
import isAbsent from './util/isAbsent';
import type { Flags, Maybe, ResolveFlags, _ } from './util/types';
import toArray from './util/toArray';
import cloneDeep from './util/cloneDeep';

export type SchemaSpec<TDefault> = {
  coerce: boolean;
  nullable: boolean;
  optional: boolean;
  default?: TDefault | (() => TDefault);
  abortEarly?: boolean;
  strip?: boolean;
  strict?: boolean;
  recursive?: boolean;
  disableStackTrace?: boolean;
  label?: string | undefined;
  meta?: SchemaMetadata;
};

export interface CustomSchemaMetadata {}

// If `CustomSchemaMeta` isn't extended with any keys, we'll fall back to a
// loose Record definition allowing free form usage.
export type SchemaMetadata = keyof CustomSchemaMetadata extends never
  ? Record<PropertyKey, any>
  : CustomSchemaMetadata;

export type SchemaOptions<TType, TDefault> = {
  type: string;
  spec?: Partial<SchemaSpec<TDefault>>;
  check: (value: any) => value is NonNullable<TType>;
};

export type AnySchema<
  TType = any,
  C = any,
  D = any,
  F extends Flags = Flags,
> = Schema<TType, C, D, F>;

export interface CastOptions<C = {}> {
  parent?: any;
  context?: C;
  assert?: boolean;
  stripUnknown?: boolean;
  // XXX: should be private?
  path?: string;
  resolved?: boolean;
}

export interface CastOptionalityOptions<C = {}>
  extends Omit<CastOptions<C>, 'assert'> {
  /**
   * Whether or not to throw TypeErrors if casting fails to produce a valid type.
   * defaults to `true`. The `'ignore-optionality'` options is provided as a migration
   * path from pre-v1 where `schema.nullable().required()` was allowed. When provided
   * cast will only throw for values that are the wrong type *not* including `null` and `undefined`
   */
  assert: 'ignore-optionality';
}

export type RunTest = (
  opts: TestOptions,
  panic: PanicCallback,
  next: NextCallback,
) => void;

export type TestRunOptions = {
  tests: RunTest[];
  path?: string | undefined;
  options: InternalOptions;
  originalValue: any;
  value: any;
};

export interface SchemaRefDescription {
  type: 'ref';
  key: string;
}

export interface SchemaInnerTypeDescription extends SchemaDescription {
  innerType?: SchemaFieldDescription | SchemaFieldDescription[];
}

export interface SchemaObjectDescription extends SchemaDescription {
  fields: Record<string, SchemaFieldDescription>;
}

export interface SchemaLazyDescription {
  type: string;
  label?: string;
  meta?: SchemaMetadata;
}

export type SchemaFieldDescription =
  | SchemaDescription
  | SchemaRefDescription
  | SchemaObjectDescription
  | SchemaInnerTypeDescription
  | SchemaLazyDescription;

export interface SchemaDescription {
  type: string;
  label?: string;
  meta?: SchemaMetadata;
  oneOf: unknown[];
  notOneOf: unknown[];
  default?: unknown;
  nullable: boolean;
  optional: boolean;
  tests: Array<{ name?: string; params: ExtraParams | undefined }>;
}

export default abstract class Schema<
  TType = any,
  TContext = any,
  TDefault = any,
  TFlags extends Flags = '',
> implements ISchema<TType, TContext, TFlags, TDefault>
{
  readonly type: string;

  declare readonly __outputType: ResolveFlags<TType, TFlags, TDefault>;
  declare readonly __context: TContext;
  declare readonly __flags: TFlags;
  declare readonly __isYupSchema__: boolean;
  declare readonly __default: TDefault;

  readonly deps: readonly string[] = [];

  tests: Test[];
  transforms: TransformFunction<AnySchema>[];

  private conditions: Condition[] = [];

  private _mutate?: boolean;

  private internalTests: Record<string, Test | null> = {};

  protected _whitelist = new ReferenceSet();
  protected _blacklist = new ReferenceSet();

  protected exclusiveTests: Record<string, boolean> = Object.create(null);
  protected _typeCheck: (value: any) => value is NonNullable<TType>;

  spec: SchemaSpec<any>;

  constructor(options: SchemaOptions<TType, any>) {
    this.tests = [];
    this.transforms = [];

    this.withMutation(() => {
      this.typeError(locale.notType);
    });

    this.type = options.type;
    this._typeCheck = options.check;

    this.spec = {
      strip: false,
      strict: false,
      abortEarly: true,
      recursive: true,
      disableStackTrace: false,
      nullable: false,
      optional: true,
      coerce: true,
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
    next._typeCheck = this._typeCheck;

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
    let next = this.clone();
    next.spec.label = label;
    return next;
  }

  meta(): SchemaMetadata | undefined;
  meta(obj: SchemaMetadata): this;
  meta(...args: [SchemaMetadata?]) {
    if (args.length === 0) return this.spec.meta;

    let next = this.clone();
    next.spec.meta = Object.assign(next.spec.meta || {}, args[0]);
    return next;
  }

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

    combined.spec = mergedSpec;
    combined.internalTests = {
      ...base.internalTests,
      ...combined.internalTests,
    };

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
        next.test(fn.OPTIONS!);
      });
    });

    combined.transforms = [...base.transforms, ...combined.transforms];
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

  resolve(options: ResolveOptions<TContext>) {
    let schema = this;

    if (schema.conditions.length) {
      let conditions = schema.conditions;

      schema = schema.clone();
      schema.conditions = [];
      schema = conditions.reduce(
        (prevSchema, condition) =>
          condition.resolve(prevSchema, options) as any,
        schema,
      ) as any as this;

      schema = schema.resolve(options);
    }

    return schema;
  }

  protected resolveOptions<T extends InternalOptions<any>>(options: T): T {
    return {
      ...options,
      from: options.from || [],
      strict: options.strict ?? this.spec.strict,
      abortEarly: options.abortEarly ?? this.spec.abortEarly,
      recursive: options.recursive ?? this.spec.recursive,
      disableStackTrace:
        options.disableStackTrace ?? this.spec.disableStackTrace,
    };
  }

  /**
   * Run the configured transform pipeline over an input value.
   */
  cast(value: any, options?: CastOptions<TContext>): this['__outputType'];
  cast(
    value: any,
    options: CastOptionalityOptions<TContext>,
  ): this['__outputType'] | null | undefined;
  cast(
    value: any,
    options: CastOptions<TContext> | CastOptionalityOptions<TContext> = {},
  ): this['__outputType'] {
    let resolvedSchema = this.resolve({
      value,
      ...options,
      // parent: options.parent,
      // context: options.context,
    });
    let allowOptionality = options.assert === 'ignore-optionality';

    let result = resolvedSchema._cast(value, options as any);

    if (options.assert !== false && !resolvedSchema.isType(result)) {
      if (allowOptionality && isAbsent(result)) {
        return result as any;
      }

      let formattedValue = printValue(value);
      let formattedResult = printValue(result);

      throw new TypeError(
        `The value of ${
          options.path || 'field'
        } could not be cast to a value ` +
          `that satisfies the schema type: "${resolvedSchema.type}". \n\n` +
          `attempted value: ${formattedValue} \n` +
          (formattedResult !== formattedValue
            ? `result of cast: ${formattedResult}`
            : ''),
      );
    }

    return result;
  }

  protected _cast(rawValue: any, options: CastOptions<TContext>): any {
    let value =
      rawValue === undefined
        ? rawValue
        : this.transforms.reduce(
            (prevValue, fn) => fn.call(this, prevValue, rawValue, this),
            rawValue,
          );

    if (value === undefined) {
      value = this.getDefault(options);
    }

    return value;
  }

  protected _validate(
    _value: any,
    options: InternalOptions<TContext> = {},
    panic: (err: Error, value: unknown) => void,
    next: (err: ValidationError[], value: unknown) => void,
  ): void {
    let { path, originalValue = _value, strict = this.spec.strict } = options;

    let value = _value;
    if (!strict) {
      value = this._cast(value, { assert: false, ...options });
    }

    let initialTests = [];
    for (let test of Object.values(this.internalTests)) {
      if (test) initialTests.push(test);
    }

    this.runTests(
      {
        path,
        value,
        originalValue,
        options,
        tests: initialTests,
      },
      panic,
      (initialErrors) => {
        // even if we aren't ending early we can't proceed further if the types aren't correct
        if (initialErrors.length) {
          return next(initialErrors, value);
        }

        this.runTests(
          {
            path,
            value,
            originalValue,
            options,
            tests: this.tests,
          },
          panic,
          next,
        );
      },
    );
  }

  /**
   * Executes a set of validations, either schema, produced Tests or a nested
   * schema validate result.
   */
  protected runTests(
    runOptions: TestRunOptions,
    panic: (err: Error, value: unknown) => void,
    next: (errors: ValidationError[], value: unknown) => void,
  ): void {
    let fired = false;
    let { tests, value, originalValue, path, options } = runOptions;

    let panicOnce = (arg: Error) => {
      if (fired) return;
      fired = true;
      panic(arg, value);
    };

    let nextOnce = (arg: ValidationError[]) => {
      if (fired) return;
      fired = true;
      next(arg, value);
    };

    let count = tests.length;
    let nestedErrors = [] as ValidationError[];

    if (!count) return nextOnce([]);

    let args = {
      value,
      originalValue,
      path,
      options,
      schema: this,
    };

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];

      test(args!, panicOnce, function finishTestRun(err) {
        if (err) {
          Array.isArray(err)
            ? nestedErrors.push(...err)
            : nestedErrors.push(err);
        }
        if (--count <= 0) {
          nextOnce(nestedErrors);
        }
      });
    }
  }

  asNestedTest({
    key,
    index,
    parent,
    parentPath,
    originalParent,
    options,
  }: NestedTestConfig): RunTest {
    const k = key ?? index;
    if (k == null) {
      throw TypeError('Must include `key` or `index` for nested validations');
    }

    const isIndex = typeof k === 'number';
    let value = parent[k];

    const testOptions = {
      ...options,
      // Nested validations fields are always strict:
      //    1. parent isn't strict so the casting will also have cast inner values
      //    2. parent is strict in which case the nested values weren't cast either
      strict: true,
      parent,
      value,
      originalValue: originalParent[k],
      // FIXME: tests depend on `index` being passed around deeply,
      //   we should not let the options.key/index bleed through
      key: undefined,
      // index: undefined,
      [isIndex ? 'index' : 'key']: k,
      path:
        isIndex || k.includes('.')
          ? `${parentPath || ''}[${isIndex ? k : `"${k}"`}]`
          : (parentPath ? `${parentPath}.` : '') + key,
    };

    return (_: any, panic, next) =>
      this.resolve(testOptions)._validate(value, testOptions, panic, next);
  }

  validate(
    value: any,
    options?: ValidateOptions<TContext>,
  ): Promise<this['__outputType']> {
    let schema = this.resolve({ ...options, value });
    let disableStackTrace =
      options?.disableStackTrace ?? schema.spec.disableStackTrace;

    return new Promise((resolve, reject) =>
      schema._validate(
        value,
        options,
        (error, parsed) => {
          if (ValidationError.isError(error)) error.value = parsed;
          reject(error);
        },
        (errors, validated) => {
          if (errors.length)
            reject(
              new ValidationError(
                errors!,
                validated,
                undefined,
                undefined,
                disableStackTrace,
              ),
            );
          else resolve(validated as this['__outputType']);
        },
      ),
    );
  }

  validateSync(
    value: any,
    options?: ValidateOptions<TContext>,
  ): this['__outputType'] {
    let schema = this.resolve({ ...options, value });
    let result: any;
    let disableStackTrace =
      options?.disableStackTrace ?? schema.spec.disableStackTrace;

    schema._validate(
      value,
      { ...options, sync: true },
      (error, parsed) => {
        if (ValidationError.isError(error)) error.value = parsed;
        throw error;
      },
      (errors, validated) => {
        if (errors.length)
          throw new ValidationError(
            errors!,
            value,
            undefined,
            undefined,
            disableStackTrace,
          );
        result = validated;
      },
    );

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
  ): value is this['__outputType'] {
    try {
      this.validateSync(value, options);
      return true;
    } catch (err) {
      if (ValidationError.isError(err)) return false;
      throw err;
    }
  }

  protected _getDefault(options?: ResolveOptions<TContext>) {
    let defaultValue = this.spec.default;

    if (defaultValue == null) {
      return defaultValue;
    }

    return typeof defaultValue === 'function'
      ? defaultValue.call(this, options)
      : cloneDeep(defaultValue);
  }

  getDefault(
    options?: ResolveOptions<TContext>,
    // If schema is defaulted we know it's at least not undefined
  ): TDefault {
    let schema = this.resolve(options || {});
    return schema._getDefault(options);
  }

  default(def: DefaultThunk<any>): any {
    if (arguments.length === 0) {
      return this._getDefault();
    }

    let next = this.clone({ default: def });

    return next as any;
  }

  strict(isStrict = true) {
    return this.clone({ strict: isStrict });
  }

  protected nullability(nullable: boolean, message?: Message<any>) {
    const next = this.clone({ nullable });
    next.internalTests.nullable = createValidation({
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
    next.internalTests.optionality = createValidation({
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

  nullable(): any {
    return this.nullability(true);
  }
  nonNullable(message = locale.notNull): any {
    return this.nullability(false, message);
  }

  required(message: Message<any> = locale.required): any {
    return this.clone().withMutation((next) =>
      next.nonNullable(message).defined(message),
    );
  }
  notRequired(): any {
    return this.clone().withMutation((next) => next.nullable().optional());
  }

  transform(fn: TransformFunction<this>) {
    let next = this.clone();
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
  test(options: TestConfig<this['__outputType'], TContext>): this;
  test(test: TestFunction<this['__outputType'], TContext>): this;
  test(name: string, test: TestFunction<this['__outputType'], TContext>): this;
  test(
    name: string,
    message: Message,
    test: TestFunction<this['__outputType'], TContext>,
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
      if (fn.OPTIONS!.name === opts.name) {
        if (isExclusive) return false;
        if (fn.OPTIONS!.test === validate.OPTIONS.test) return false;
      }
      return true;
    });

    next.tests.push(validate);

    return next;
  }

  when(builder: ConditionBuilder<this>): this;
  when(keys: string | string[], builder: ConditionBuilder<this>): this;
  when(options: ConditionConfig<this>): this;
  when(keys: string | string[], options: ConditionConfig<this>): this;
  when(
    keys: string | string[] | ConditionBuilder<this> | ConditionConfig<this>,
    options?: ConditionBuilder<this> | ConditionConfig<this>,
  ) {
    if (!Array.isArray(keys) && typeof keys !== 'string') {
      options = keys;
      keys = '.';
    }

    let next = this.clone();
    let deps = toArray(keys).map((key) => new Ref(key));

    deps.forEach((dep) => {
      // @ts-ignore readonly array
      if (dep.isSibling) next.deps.push(dep.key);
    });

    next.conditions.push(
      (typeof options === 'function'
        ? new Condition(deps, options!)
        : Condition.fromOptions(deps, options!)) as Condition,
    );

    return next;
  }

  typeError(message: Message) {
    let next = this.clone();

    next.internalTests.typeError = createValidation({
      message,
      name: 'typeError',
      skipAbsent: true,
      test(value) {
        if (!this.schema._typeCheck(value))
          return this.createError({
            params: {
              type: this.schema.type,
            },
          });
        return true;
      },
    });
    return next;
  }

  oneOf<U extends TType>(
    enums: ReadonlyArray<U | Reference>,
    message?: Message<{ values: any }>,
  ): this;
  oneOf(
    enums: ReadonlyArray<TType | Reference>,
    message: Message<{ values: any }>,
  ): any;
  oneOf<U extends TType>(
    enums: ReadonlyArray<U | Reference>,
    message = locale.oneOf,
  ): any {
    let next = this.clone();

    enums.forEach((val) => {
      next._whitelist.add(val);
      next._blacklist.delete(val);
    });

    next.internalTests.whiteList = createValidation({
      message,
      name: 'oneOf',
      skipAbsent: true,
      test(value) {
        let valids = (this.schema as Schema)._whitelist;
        let resolved = valids.resolveAll(this.resolve);

        return resolved.includes(value)
          ? true
          : this.createError({
              params: {
                values: Array.from(valids).join(', '),
                resolved,
              },
            });
      },
    });

    return next;
  }

  notOneOf<U extends TType>(
    enums: ReadonlyArray<Maybe<U> | Reference>,
    message = locale.notOneOf,
  ): this {
    let next = this.clone();
    enums.forEach((val) => {
      next._blacklist.add(val);
      next._whitelist.delete(val);
    });

    next.internalTests.blacklist = createValidation({
      message,
      name: 'notOneOf',
      test(value) {
        let invalids = (this.schema as Schema)._blacklist;
        let resolved = invalids.resolveAll(this.resolve);
        if (resolved.includes(value))
          return this.createError({
            params: {
              values: Array.from(invalids).join(', '),
              resolved,
            },
          });
        return true;
      },
    });

    return next;
  }

  strip(strip = true): any {
    let next = this.clone();
    next.spec.strip = strip;
    return next as any;
  }

  /**
   * Return a serialized description of the schema including validations, flags, types etc.
   *
   * @param options Provide any needed context for resolving runtime schema alterations (lazy, when conditions, etc).
   */
  describe(options?: ResolveOptions<TContext>) {
    const next = (options ? this.resolve(options) : this).clone();
    const { label, meta, optional, nullable } = next.spec;
    const description: SchemaDescription = {
      meta,
      label,
      optional,
      nullable,
      default: next.getDefault(options),
      type: next.type,
      oneOf: next._whitelist.describe(),
      notOneOf: next._blacklist.describe(),
      tests: next.tests
        .map((fn) => ({ name: fn.OPTIONS!.name, params: fn.OPTIONS!.params }))
        .filter(
          (n, idx, list) => list.findIndex((c) => c.name === n.name) === idx,
        ),
    };

    return description;
  }
}

export default interface Schema<
  /* eslint-disable @typescript-eslint/no-unused-vars */
  TType = any,
  TContext = any,
  TDefault = any,
  TFlags extends Flags = '',
  /* eslint-enable @typescript-eslint/no-unused-vars */
> {
  validateAt(
    path: string,
    value: any,
    options?: ValidateOptions<TContext>,
  ): Promise<any>;
  validateSyncAt(
    path: string,
    value: any,
    options?: ValidateOptions<TContext>,
  ): any;
  equals: Schema['oneOf'];
  is: Schema['oneOf'];
  not: Schema['notOneOf'];
  nope: Schema['notOneOf'];
}

// @ts-expect-error
Schema.prototype.__isYupSchema__ = true;

for (const method of ['validate', 'validateSync'])
  Schema.prototype[`${method}At` as 'validateAt' | 'validateSyncAt'] =
    function (path: string, value: any, options: ValidateOptions = {}) {
      const { parent, parentPath, schema } = getIn(
        this,
        path,
        value,
        options.context,
      );
      return (schema as any)[method](parent && parent[parentPath], {
        ...options,
        parent,
        path,
      });
    };

for (const alias of ['equals', 'is'] as const)
  Schema.prototype[alias] = Schema.prototype.oneOf;

for (const alias of ['not', 'nope'] as const)
  Schema.prototype[alias] = Schema.prototype.notOneOf;
