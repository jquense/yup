// @ts-ignore
import { getter, normalizePath, join } from 'property-expr';
import { camelCase, snakeCase } from 'tiny-case';

import { Flags, Maybe, SetFlag, ToggleDefault, UnsetFlag } from './util/types';
import { object as locale } from './locale';
import sortFields from './util/sortFields';
import sortByKeyOrder from './util/sortByKeyOrder';
import { DefaultThunk, InternalOptions, ISchema, Message } from './types';
import type { Defined, NotNull, _ } from './util/types';
import Reference from './Reference';
import Schema, { SchemaObjectDescription, SchemaSpec } from './schema';
import { ResolveOptions } from './Condition';
import type {
  AnyObject,
  ConcatObjectTypes,
  DefaultFromShape,
  MakePartial,
  MergeObjectTypes,
  ObjectShape,
  PartialDeep,
  TypeFromShape,
} from './util/objectTypes';
import parseJson from './util/parseJson';
import type { Test } from './util/createValidation';
import type ValidationError from './ValidationError';
export type { AnyObject };

type MakeKeysOptional<T> = T extends AnyObject ? _<MakePartial<T>> : T;

export type Shape<T extends Maybe<AnyObject>, C = any> = {
  [field in keyof T]-?: ISchema<T[field], C> | Reference;
};

export type ObjectSchemaSpec = SchemaSpec<any> & {
  noUnknown?: boolean;
};

function deepPartial(schema: any) {
  if ('fields' in schema) {
    const partial: any = {};
    for (const [key, fieldSchema] of Object.entries(schema.fields)) {
      partial[key] = deepPartial(fieldSchema);
    }
    return schema.setFields(partial);
  }
  if (schema.type === 'array') {
    const nextArray = schema.optional();
    if (nextArray.innerType)
      nextArray.innerType = deepPartial(nextArray.innerType);
    return nextArray;
  }
  if (schema.type === 'tuple') {
    return schema
      .optional()
      .clone({ types: schema.spec.types.map(deepPartial) });
  }
  if ('optional' in schema) {
    return schema.optional();
  }
  return schema;
}

const deepHas = (obj: any, p: string) => {
  const path = [...normalizePath(p)];
  if (path.length === 1) return path[0] in obj;
  let last = path.pop()!;
  let parent = getter(join(path), true)(obj);
  return !!(parent && last in parent);
};

let isObject = (obj: any): obj is Record<PropertyKey, unknown> =>
  Object.prototype.toString.call(obj) === '[object Object]';

function unknown(ctx: ObjectSchema<any, any, any>, value: any) {
  let known = Object.keys(ctx.fields);
  return Object.keys(value).filter((key) => known.indexOf(key) === -1);
}

const defaultSort = sortByKeyOrder([]);

export function create<
  C extends Maybe<AnyObject> = AnyObject,
  S extends ObjectShape = {},
>(spec?: S) {
  type TIn = _<TypeFromShape<S, C>>;
  type TDefault = _<DefaultFromShape<S>>;

  return new ObjectSchema<TIn, C, TDefault>(spec as any);
}

export default interface ObjectSchema<
  TIn extends Maybe<AnyObject>,
  TContext = AnyObject,
  // important that this is `any` so that using `ObjectSchema<MyType>`'s default
  // will match object schema regardless of defaults
  TDefault = any,
  TFlags extends Flags = '',
> extends Schema<MakeKeysOptional<TIn>, TContext, TDefault, TFlags> {
  default<D extends Maybe<AnyObject>>(
    def: DefaultThunk<D, TContext>,
  ): ObjectSchema<TIn, TContext, D, ToggleDefault<TFlags, 'd'>>;

  defined(
    msg?: Message,
  ): ObjectSchema<Defined<TIn>, TContext, TDefault, TFlags>;
  optional(): ObjectSchema<TIn | undefined, TContext, TDefault, TFlags>;

  required(
    msg?: Message,
  ): ObjectSchema<NonNullable<TIn>, TContext, TDefault, TFlags>;
  notRequired(): ObjectSchema<Maybe<TIn>, TContext, TDefault, TFlags>;

  nullable(msg?: Message): ObjectSchema<TIn | null, TContext, TDefault, TFlags>;
  nonNullable(
    msg?: Message,
  ): ObjectSchema<NotNull<TIn>, TContext, TDefault, TFlags>;

  strip(
    enabled: false,
  ): ObjectSchema<TIn, TContext, TDefault, UnsetFlag<TFlags, 's'>>;
  strip(
    enabled?: true,
  ): ObjectSchema<TIn, TContext, TDefault, SetFlag<TFlags, 's'>>;
}

export default class ObjectSchema<
  TIn extends Maybe<AnyObject>,
  TContext = AnyObject,
  TDefault = any,
  TFlags extends Flags = '',
> extends Schema<MakeKeysOptional<TIn>, TContext, TDefault, TFlags> {
  fields: Shape<NonNullable<TIn>, TContext> = Object.create(null);

  declare spec: ObjectSchemaSpec;

  private _sortErrors = defaultSort;
  private _nodes: string[] = [];

  private _excludedEdges: readonly [nodeA: string, nodeB: string][] = [];

  constructor(spec?: Shape<TIn, TContext>) {
    super({
      type: 'object',
      check(value): value is NonNullable<MakeKeysOptional<TIn>> {
        return isObject(value) || typeof value === 'function';
      },
    });

    this.withMutation(() => {
      if (spec) {
        this.shape(spec as any);
      }
    });
  }

  protected _cast(_value: any, options: InternalOptions<TContext> = {}) {
    let value = super._cast(_value, options);

    //should ignore nulls here
    if (value === undefined) return this.getDefault(options);

    if (!this._typeCheck(value)) return value;

    let fields = this.fields;

    let strip = options.stripUnknown ?? this.spec.noUnknown;
    let props = ([] as string[]).concat(
      this._nodes,
      Object.keys(value).filter((v) => !this._nodes.includes(v)),
    );

    let intermediateValue: Record<string, unknown> = {}; // is filled during the transform below
    let innerOptions: InternalOptions<TContext> = {
      ...options,
      parent: intermediateValue,
      __validating: options.__validating || false,
    };

    let isChanged = false;
    for (const prop of props) {
      let field = fields[prop];
      let exists = prop in (value as {})!;

      if (field) {
        let fieldValue;
        let inputValue = value[prop];

        // safe to mutate since this is fired in sequence
        innerOptions.path = (options.path ? `${options.path}.` : '') + prop;

        field = field.resolve({
          value: inputValue,
          context: options.context,
          parent: intermediateValue,
        });

        let fieldSpec = field instanceof Schema ? field.spec : undefined;
        let strict = fieldSpec?.strict;

        if (fieldSpec?.strip) {
          isChanged = isChanged || prop in (value as {});
          continue;
        }

        fieldValue =
          !options.__validating || !strict
            ? // TODO: use _cast, this is double resolving
              (field as ISchema<any>).cast(value[prop], innerOptions)
            : value[prop];

        if (fieldValue !== undefined) {
          intermediateValue[prop] = fieldValue;
        }
      } else if (exists && !strip) {
        intermediateValue[prop] = value[prop];
      }

      if (
        exists !== prop in intermediateValue ||
        intermediateValue[prop] !== value[prop]
      ) {
        isChanged = true;
      }
    }

    return isChanged ? intermediateValue : value;
  }

  protected _validate(
    _value: any,
    options: InternalOptions<TContext> = {},
    panic: (err: Error, value: unknown) => void,
    next: (err: ValidationError[], value: unknown) => void,
  ) {
    let {
      from = [],
      originalValue = _value,
      recursive = this.spec.recursive,
    } = options;

    options.from = [{ schema: this, value: originalValue }, ...from];
    // this flag is needed for handling `strict` correctly in the context of
    // validation vs just casting. e.g strict() on a field is only used when validating
    options.__validating = true;
    options.originalValue = originalValue;

    super._validate(_value, options, panic, (objectErrors, value) => {
      if (!recursive || !isObject(value)) {
        next(objectErrors, value);
        return;
      }

      originalValue = originalValue || value;

      let tests = [] as Test[];
      for (let key of this._nodes) {
        let field = this.fields[key];

        if (!field || Reference.isRef(field)) {
          continue;
        }

        tests.push(
          field.asNestedTest({
            options,
            key,
            parent: value,
            parentPath: options.path,
            originalParent: originalValue,
          }),
        );
      }

      this.runTests(
        { tests, value, originalValue, options },
        panic,
        (fieldErrors) => {
          next(fieldErrors.sort(this._sortErrors).concat(objectErrors), value);
        },
      );
    });
  }

  clone(spec?: Partial<ObjectSchemaSpec>): this {
    const next = super.clone(spec);
    next.fields = { ...this.fields };
    next._nodes = this._nodes;
    next._excludedEdges = this._excludedEdges;
    next._sortErrors = this._sortErrors;

    return next;
  }

  concat<IIn extends Maybe<AnyObject>, IC, ID, IF extends Flags>(
    schema: ObjectSchema<IIn, IC, ID, IF>,
  ): ObjectSchema<
    ConcatObjectTypes<TIn, IIn>,
    TContext & IC,
    Extract<IF, 'd'> extends never
      ? // this _attempts_ to cover the default from shape case
        TDefault extends AnyObject
        ? ID extends AnyObject
          ? _<ConcatObjectTypes<TDefault, ID>>
          : ID
        : ID
      : ID,
    TFlags | IF
  >;
  concat(schema: this): this;
  concat(schema: any): any {
    let next = super.concat(schema) as any;

    let nextFields = next.fields;
    for (let [field, schemaOrRef] of Object.entries(this.fields)) {
      const target = nextFields[field];
      nextFields[field] = target === undefined ? schemaOrRef : target;
    }

    return next.withMutation((s: any) =>
      // XXX: excludes here is wrong
      s.setFields(nextFields, [
        ...this._excludedEdges,
        ...schema._excludedEdges,
      ]),
    );
  }

  protected _getDefault(options?: ResolveOptions<TContext>) {
    if ('default' in this.spec) {
      return super._getDefault(options);
    }

    // if there is no default set invent one
    if (!this._nodes.length) {
      return undefined;
    }

    let dft: any = {};
    this._nodes.forEach((key) => {
      const field = this.fields[key] as any;

      let innerOptions = options;
      if (innerOptions?.value) {
        innerOptions = {
          ...innerOptions,
          parent: innerOptions.value,
          value: innerOptions.value[key],
        };
      }

      dft[key] =
        field && 'getDefault' in field
          ? field.getDefault(innerOptions)
          : undefined;
    });

    return dft;
  }

  private setFields<TInNext extends Maybe<AnyObject>, TDefaultNext>(
    shape: Shape<TInNext, TContext>,
    excludedEdges?: readonly [string, string][],
  ): ObjectSchema<TInNext, TContext, TDefaultNext, TFlags> {
    let next = this.clone() as any;
    next.fields = shape;

    next._nodes = sortFields(shape, excludedEdges);
    next._sortErrors = sortByKeyOrder(Object.keys(shape));
    // XXX: this carries over edges which may not be what you want
    if (excludedEdges) next._excludedEdges = excludedEdges;
    return next;
  }

  shape<U extends ObjectShape>(
    additions: U,
    excludes: readonly [string, string][] = [],
  ) {
    type UIn = TypeFromShape<U, TContext>;
    type UDefault = Extract<TFlags, 'd'> extends never
      ? // not defaulted then assume the default is derived and should be merged
        _<TDefault & DefaultFromShape<U>>
      : TDefault;

    return this.clone().withMutation((next) => {
      let edges = next._excludedEdges;
      if (excludes.length) {
        if (!Array.isArray(excludes[0])) excludes = [excludes as any];

        edges = [...next._excludedEdges, ...excludes];
      }

      // XXX: excludes here is wrong
      return next.setFields<_<MergeObjectTypes<TIn, UIn>>, UDefault>(
        Object.assign(next.fields, additions) as any,
        edges,
      );
    });
  }

  partial() {
    const partial: any = {};
    for (const [key, schema] of Object.entries(this.fields)) {
      partial[key] =
        'optional' in schema && schema.optional instanceof Function
          ? schema.optional()
          : schema;
    }

    return this.setFields<Partial<TIn>, TDefault>(partial);
  }

  deepPartial(): ObjectSchema<PartialDeep<TIn>, TContext, TDefault, TFlags> {
    const next = deepPartial(this);
    return next;
  }

  pick<TKey extends keyof TIn>(keys: readonly TKey[]) {
    const picked: any = {};
    for (const key of keys) {
      if (this.fields[key]) picked[key] = this.fields[key];
    }

    return this.setFields<{ [K in TKey]: TIn[K] }, TDefault>(
      picked,
      this._excludedEdges.filter(
        ([a, b]) => keys.includes(a as TKey) && keys.includes(b as TKey),
      ),
    );
  }

  omit<TKey extends keyof TIn>(keys: readonly TKey[]) {
    const remaining: TKey[] = [];

    for (const key of Object.keys(this.fields) as TKey[]) {
      if (keys.includes(key)) continue;
      remaining.push(key);
    }

    return this.pick<keyof Omit<TIn, TKey>>(remaining as any);
  }

  from(from: string, to: keyof TIn, alias?: boolean) {
    let fromGetter = getter(from, true);

    return this.transform((obj) => {
      if (!obj) return obj;
      let newObj = obj;
      if (deepHas(obj, from)) {
        newObj = { ...obj };
        if (!alias) delete newObj[from];

        newObj[to] = fromGetter(obj);
      }

      return newObj;
    });
  }

  /** Parse an input JSON string to an object */
  json() {
    return this.transform(parseJson);
  }

  /**
   * Similar to `noUnknown` but only validates that an object is the right shape without stripping the unknown keys
   */
  exact(message?: Message): this {
    return this.test({
      name: 'exact',
      exclusive: true,
      message: message || locale.exact,
      test(value) {
        if (value == null) return true;

        const unknownKeys = unknown(this.schema, value);

        return (
          unknownKeys.length === 0 ||
          this.createError({ params: { properties: unknownKeys.join(', ') } })
        );
      },
    });
  }

  stripUnknown(): this {
    return this.clone({ noUnknown: true });
  }

  noUnknown(message?: Message): this;
  noUnknown(noAllow: boolean, message?: Message): this;
  noUnknown(noAllow: Message | boolean = true, message = locale.noUnknown) {
    if (typeof noAllow !== 'boolean') {
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

    next.spec.noUnknown = noAllow;

    return next;
  }

  unknown(allow = true, message = locale.noUnknown) {
    return this.noUnknown(!allow, message);
  }

  transformKeys(fn: (key: string) => string) {
    return this.transform((obj) => {
      if (!obj) return obj;
      const result: AnyObject = {};
      for (const key of Object.keys(obj)) result[fn(key)] = obj[key];
      return result;
    });
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

  describe(options?: ResolveOptions<TContext>) {
    const next = (options ? this.resolve(options) : this).clone();
    const base = super.describe(options) as SchemaObjectDescription;
    base.fields = {};
    for (const [key, value] of Object.entries(next.fields)) {
      let innerOptions = options;
      if (innerOptions?.value) {
        innerOptions = {
          ...innerOptions,
          parent: innerOptions.value,
          value: innerOptions.value[key],
        };
      }
      base.fields[key] = value.describe(innerOptions);
    }
    return base;
  }
}

create.prototype = ObjectSchema.prototype;
