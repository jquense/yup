// @ts-ignore
import { getter, normalizePath, join } from 'property-expr';
import { camelCase, snakeCase } from 'tiny-case';

import { Flags, ISchema } from './util/types';

import { object as locale } from './locale';
import sortFields from './util/sortFields';
import sortByKeyOrder from './util/sortByKeyOrder';
import runTests from './util/runTests';
import {
  InternalOptions,
  Callback,
  Maybe,
  Message,
  Optionals,
  Preserve,
} from './types';
import ValidationError from './ValidationError';
import type {
  Defined,
  Thunk,
  NotNull,
  ToggleDefault,
  _,
  MakePartial,
} from './util/types';
import type Reference from './Reference';
import BaseSchema, { SchemaObjectDescription, SchemaSpec } from './schema';
import { ResolveOptions } from './Condition';

export type Assign<T extends {}, U extends {}> = {
  [P in keyof T]: P extends keyof U ? U[P] : T[P];
} & U;

export type MergeObjectTypes<T extends Maybe<AnyObject>, U extends AnyObject> =
  | ({ [P in keyof T]: P extends keyof U ? U[P] : T[P] } & U)
  | Optionals<T>;

export type AnyObject = Record<string, any>;

export type ObjectShape = { [k: string]: ISchema<any> | Reference };

type MakeKeysOptional<T> = T extends AnyObject ? _<MakePartial<T>> : T;

type PartialDeep<T> = T extends
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | symbol
  | Date
  ? T | undefined
  : // Arrays, Sets and Maps and their readonly counterparts have their items made
  // deeply partial, but their own instances are left untouched
  T extends Array<infer ArrayType>
  ? Array<PartialDeep<ArrayType>>
  : T extends ReadonlyArray<infer ArrayType>
  ? ReadonlyArray<ArrayType>
  : {
      [K in keyof T]?: PartialDeep<T[K]>;
    };

export type Shape<T extends Maybe<AnyObject>, C = AnyObject> = {
  [field in keyof T]: ISchema<T[field], C> | Reference;
};

export type ObjectSchemaSpec = SchemaSpec<any> & {
  noUnknown?: boolean;
};

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

type TypeFromShape<S extends ObjectShape, C> = {
  [K in keyof S]: S[K] extends ISchema<any, C> ? S[K]['__outputType'] : unknown;
};

export type DefaultFromShape<Shape extends ObjectShape> = {
  [K in keyof Shape]: Shape[K] extends { getDefault: () => infer D }
    ? D
    : never;
};

export function create<S extends ObjectShape, C = AnyObject>(spec?: S) {
  return new ObjectSchema<_<TypeFromShape<S, C>>, C, DefaultFromShape<S>, 'd'>(
    spec as any,
  );
}

export default interface ObjectSchema<
  TIn extends Maybe<AnyObject>,
  TContext = AnyObject,
  TDefault = any,
  TFlags extends Flags = 'd',
> extends BaseSchema<MakeKeysOptional<TIn>, TContext, TFlags> {
  // override readonly __outputType: ResolveFlags<_<MakeKeysOptional<TIn>>, TFlags>;

  // new <T extends AnyObject = {}, C = AnyObject>(
  //   shape?: Shape<T, C>,
  // ): ObjectSchema<T, C, 'd'>;

  default<D extends Maybe<AnyObject>>(
    def: Thunk<D>,
  ): ObjectSchema<TIn, TContext, TDefault, ToggleDefault<TFlags, D>>;

  defined(
    msg?: Message,
  ): ObjectSchema<Defined<TIn>, TContext, TDefault, TFlags>;
  optional(): ObjectSchema<TIn | undefined, TContext, TDefault, TFlags>;

  required(
    msg?: Message,
  ): ObjectSchema<NonNullable<TIn>, TContext, TDefault, TFlags>;
  notRequired(): ObjectSchema<Maybe<TIn>, TContext, TDefault, TFlags>;

  nullable(
    isNullable?: true,
  ): ObjectSchema<TIn | null, TContext, TDefault, TFlags>;
  nullable(
    isNullable: false,
  ): ObjectSchema<NotNull<TIn>, TContext, TDefault, TFlags>;
}

export default class ObjectSchema<
  TIn extends Maybe<AnyObject>,
  TContext = AnyObject,
  TDefault = any,
  TFlags extends Flags = 'd',
> extends BaseSchema<MakeKeysOptional<TIn>, TContext, TFlags> {
  fields: Shape<NonNullable<TIn>, TContext> = Object.create(null);

  declare spec: ObjectSchemaSpec;

  private _sortErrors = defaultSort;
  private _nodes: string[] = []; //readonly (keyof TIn & string)[]

  private _excludedEdges: readonly [nodeA: string, nodeB: string][] = [];

  constructor(spec?: Shape<TIn, TContext>) {
    super({
      type: 'object',
    });

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

  protected _typeCheck(
    value: any,
  ): value is NonNullable<MakeKeysOptional<TIn>> {
    return isObject(value) || typeof value === 'function';
  }

  protected _cast(_value: any, options: InternalOptions<TContext> = {}) {
    let value = super._cast(_value, options);

    //should ignore nulls here
    if (value === undefined) return this.getDefault();

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
      let exists = prop in value!;

      if (field) {
        let fieldValue;
        let inputValue = value[prop];

        // safe to mutate since this is fired in sequence
        innerOptions.path = (options.path ? `${options.path}.` : '') + prop;
        // innerOptions.value = value[prop];

        field = field.resolve({
          value: inputValue,
          context: options.context,
          parent: intermediateValue,
        });

        let fieldSpec = field instanceof BaseSchema ? field.spec : undefined;
        let strict = fieldSpec?.strict;

        if (fieldSpec?.strip) {
          isChanged = isChanged || prop in value;
          continue;
        }

        fieldValue =
          !options.__validating || !strict
            ? // TODO: use _cast, this is double resolving
              field.cast(value[prop], innerOptions)
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

  protected _validate(
    _value: any,
    opts: InternalOptions<TContext> = {},
    callback: Callback,
  ) {
    let errors = [] as ValidationError[];
    let {
      sync,
      from = [],
      originalValue = _value,
      abortEarly = this.spec.abortEarly,
      recursive = this.spec.recursive,
    } = opts;

    from = [{ schema: this, value: originalValue }, ...from];

    // this flag is needed for handling `strict` correctly in the context of
    // validation vs just casting. e.g strict() on a field is only used when validating
    opts.__validating = true;
    opts.originalValue = originalValue;
    opts.from = from;

    super._validate(_value, opts, (err, value) => {
      if (err) {
        if (!ValidationError.isError(err) || abortEarly) {
          return void callback(err, value);
        }
        errors.push(err);
      }

      if (!recursive || !isObject(value)) {
        callback(errors[0] || null, value);
        return;
      }

      originalValue = originalValue || value;

      let tests = this._nodes.map((key) => (__: any, cb: Callback) => {
        let path =
          key.indexOf('.') === -1
            ? (opts.path ? `${opts.path}.` : '') + key
            : `${opts.path || ''}["${key}"]`;

        let field = this.fields[key];

        if (field && 'validate' in field) {
          field.validate(
            value[key],
            {
              ...opts,
              // @ts-ignore
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

  clone(spec?: ObjectSchemaSpec): this {
    const next = super.clone(spec);
    next.fields = { ...this.fields };
    next._nodes = this._nodes;
    next._excludedEdges = this._excludedEdges;
    next._sortErrors = this._sortErrors;

    return next;
  }

  concat<IIn, IC, ID, IF extends Flags>(
    schema: ObjectSchema<IIn, IC, ID, IF>,
  ): ObjectSchema<
    NonNullable<TIn> | IIn,
    TContext & IC,
    TDefault & ID,
    TFlags | IF
  >;
  concat(schema: this): this;
  concat(schema: any): any {
    let next = super.concat(schema) as any;

    let nextFields = next.fields;
    for (let [field, schemaOrRef] of Object.entries(this.fields)) {
      const target = nextFields[field];
      if (target === undefined) {
        nextFields[field] = schemaOrRef;
      } else if (
        target instanceof BaseSchema &&
        schemaOrRef instanceof BaseSchema
      ) {
        nextFields[field] = schemaOrRef.concat(target);
      }
    }

    return next.withMutation((s: any) =>
      s.setFields(nextFields, this._excludedEdges),
    );
  }

  protected _getDefault() {
    if ('default' in this.spec) {
      return super._getDefault();
    }

    // if there is no default set invent one
    if (!this._nodes.length) {
      return undefined;
    }

    return this.getDefaultFromShape();
  }
  // FIXME
  getDefaultFromShape(): TDefault {
    let dft: any = {};
    this._nodes.forEach((key) => {
      const field = this.fields[key] as any;
      dft[key] = 'getDefault' in field ? field.getDefault() : undefined;
    });
    return dft;
  }

  private setFields<TInNext extends Maybe<AnyObject>>(
    shape: Shape<TInNext, TContext>,
    excludedEdges?: readonly [string, string][],
  ): ObjectSchema<TInNext, TContext, TFlags> {
    let next = this.clone() as any;
    next.fields = shape;

    next._nodes = sortFields(shape, excludedEdges);
    next._sortErrors = sortByKeyOrder(Object.keys(shape));
    // XXX: this carries over edges which may not be what you want
    if (excludedEdges) next._excludedEdges = excludedEdges;
    return next;
  }

  shape<U extends AnyObject>(
    additions: Shape<U, TContext>,
    excludes: [string, string][] = [],
  ) {
    return this.clone().withMutation((next) => {
      let edges = next._excludedEdges;
      if (excludes.length) {
        if (!Array.isArray(excludes[0])) excludes = [excludes as any];

        edges = [...next._excludedEdges, ...excludes];
      }

      // XXX: excludes here is wrong
      return next.setFields<_<MergeObjectTypes<TIn, U>>>(
        Object.assign(next.fields, additions) as any,
        edges,
      );
    });
  }

  partial() {
    const partial: any = {};
    for (const [key, schema] of Object.entries(this.fields)) {
      partial[key] = schema instanceof BaseSchema ? schema.optional() : schema;
    }

    return this.setFields<Partial<TIn>>(partial);
  }

  deepPartial() {
    const partial: any = {};
    for (const [key, schema] of Object.entries(this.fields)) {
      if (schema instanceof ObjectSchema) partial[key] = schema.deepPartial();
      else
        partial[key] =
          schema instanceof BaseSchema ? schema.optional() : schema;
    }
    return this.setFields<PartialDeep<TIn>>(partial);
  }

  pick<TKey extends keyof TIn>(keys: TKey[]) {
    const picked: any = {};
    for (const key of keys) {
      if (this.fields[key]) picked[key] = this.fields[key];
    }

    return this.setFields<Pick<TIn, TKey>>(picked);
  }

  omit<TKey extends keyof TIn>(keys: TKey[]) {
    const fields = { ...this.fields };

    for (const key of keys) {
      delete fields[key];
    }

    return this.setFields<Omit<TIn, TKey>>(fields);
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
    let base = super.describe(options) as SchemaObjectDescription;
    base.fields = {};
    for (const [key, value] of Object.entries(this.fields)) {
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
