import has from 'lodash/has';
import snakeCase from 'lodash/snakeCase';
import camelCase from 'lodash/camelCase';
import mapKeys from 'lodash/mapKeys';
import mapValues from 'lodash/mapValues';
import { getter } from 'property-expr';

import { MixedLocale, object as locale } from './locale';
import sortFields from './util/sortFields';
import sortByKeyOrder from './util/sortByKeyOrder';
import runTests from './util/runTests';
import { InternalOptions, Callback, Maybe, Optionals, Preserve } from './types';
import ValidationError from './ValidationError';
import type { TypedSchema, Defined } from './util/types';
import type Reference from './Reference';
import Lazy from './Lazy';
import BaseSchema, {
  AnySchema,
  SchemaObjectDescription,
  SchemaSpec,
} from './schema';

export type Assign<T extends {}, U extends {}> = {
  [P in keyof T]: P extends keyof U ? U[P] : T[P];
} &
  U;

export type AnyObject = Record<string, any>;

export type ObjectShape = Record<
  string,
  AnySchema | Reference | Lazy<any, any>
>;

export type DefaultFromShape<Shape extends ObjectShape> = {
  [K in keyof Shape]: Shape[K] extends ObjectSchema<infer TShape>
    ? DefaultFromShape<TShape>
    : Shape[K] extends { getDefault: () => infer D }
    ? Preserve<D, undefined> extends never
      ? Defined<D>
      : Preserve<D, undefined>
    : undefined;
};

export type TypeOfShape<Shape extends ObjectShape> = {
  [K in keyof Shape]: Shape[K] extends TypedSchema
    ? Shape[K]['__inputType']
    : Shape[K] extends Reference
    ? unknown
    : never;
};

export type AssertsShape<Shape extends ObjectShape> = {
  [K in keyof Shape]: Shape[K] extends TypedSchema
    ? Shape[K]['__outputType']
    : Shape[K] extends Reference
    ? unknown
    : never;
};

export type ObjectSchemaSpec = SchemaSpec<any> & {
  noUnknown?: boolean;
};

let isObject = (obj: any): obj is Record<PropertyKey, unknown> =>
  Object.prototype.toString.call(obj) === '[object Object]';

function unknown(ctx: ObjectSchema<any, any, any>, value: any) {
  let known = Object.keys(ctx.fields);
  return Object.keys(value).filter((key) => known.indexOf(key) === -1);
}

const defaultSort = sortByKeyOrder([]);

export default class ObjectSchema<
  TShape extends ObjectShape,
  TContext extends AnyObject = AnyObject,
  TIn extends Maybe<TypeOfShape<TShape>> = TypeOfShape<TShape>,
  TOut extends Maybe<AssertsShape<TShape>> =
    | AssertsShape<TShape>
    | Optionals<TIn>
> extends BaseSchema<TIn, TContext, TOut> {
  fields: TShape = Object.create(null);

  spec!: ObjectSchemaSpec;

  private _sortErrors = defaultSort;
  private _nodes: readonly string[] = [];
  private _excludedEdges: readonly string[] = [];

  constructor(spec?: TShape) {
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

  protected _typeCheck(value: any): value is NonNullable<TIn> {
    return isObject(value) || typeof value === 'function';
  }

  protected _cast(_value: any, options: InternalOptions<TContext> = {}) {
    let value = super._cast(_value, options);

    //should ignore nulls here
    if (value === undefined) return this.getDefault();

    if (!this._typeCheck(value)) return value;

    let fields = this.fields;

    let strip = options.stripUnknown ?? this.spec.noUnknown;
    let props = this._nodes.concat(
      Object.keys(value).filter((v) => this._nodes.indexOf(v) === -1),
    );

    let intermediateValue: Record<string, unknown> = {}; // is filled during the transform below
    let innerOptions: InternalOptions = {
      ...options,
      parent: intermediateValue,
      __validating: options.__validating || false,
    };

    let isChanged = false;
    for (const prop of props) {
      let field = fields[prop];
      let exists = has(value!, prop);

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

        let fieldSpec = 'spec' in field ? field.spec : undefined;
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

      let tests = this._nodes.map((key) => (_: any, cb: Callback) => {
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

  concat<TOther extends ObjectSchema<any, any, any>>(
    schema: TOther,
  ): TOther extends ObjectSchema<infer S, infer C, infer IType>
    ? ObjectSchema<
        TShape & S,
        TContext & C,
        TypeOfShape<TShape & S> | Optionals<IType>
      >
    : never;
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

    return next.withMutation((next: any) => next.shape(nextFields));
  }

  getDefaultFromShape(): DefaultFromShape<TShape> {
    let dft = {} as Record<string, unknown>;
    this._nodes.forEach((key) => {
      const field = this.fields[key];
      dft[key] = 'default' in field ? field.getDefault() : undefined;
    });
    return dft as any;
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

  shape<TNextShape extends ObjectShape>(
    additions: TNextShape,
    excludes: [string, string][] = [],
  ): ObjectSchema<
    Assign<TShape, TNextShape>,
    TContext,
    TypeOfShape<Assign<TShape, TNextShape>> | Optionals<TIn>
  > {
    let next = this.clone();
    let fields = Object.assign(next.fields, additions);

    next.fields = fields;
    next._sortErrors = sortByKeyOrder(Object.keys(fields));

    if (excludes.length) {
      if (!Array.isArray(excludes[0])) excludes = [excludes as any];

      let keys = excludes.map(([first, second]) => `${first}-${second}`);

      next._excludedEdges = next._excludedEdges.concat(keys);
    }

    next._nodes = sortFields(fields, next._excludedEdges);

    return next as any;
  }

  pick(keys: string[]) {
    const picked: any = {};
    for (const key of keys) {
      if (this.fields[key]) picked[key] = this.fields[key];
    }

    return this.clone().withMutation((next: any) => {
      next.fields = {};
      return next.shape(picked);
    }) as any;
  }

  omit(keys: string[]): any {
    const next = this.clone() as any;
    const fields = next.fields;
    next.fields = {};
    for (const key of keys) {
      delete fields[key];
    }

    return next.withMutation((next: any) => next.shape(fields));
  }

  from(from: string, to: keyof TShape, alias?: boolean) {
    let fromGetter = getter(from, true);

    return this.transform((obj) => {
      if (obj == null) return obj;
      let newObj = obj;
      if (has(obj, from)) {
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
    return this.transform((obj) => obj && mapKeys(obj, (_, key) => fn(key)));
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

  describe() {
    let base = super.describe() as SchemaObjectDescription;
    base.fields = mapValues(this.fields, (value) => value.describe());
    return base;
  }
}

export function create<TShape extends ObjectShape>(spec?: TShape) {
  return new ObjectSchema<TShape>(spec) as OptionalObjectSchema<TShape>;
}

create.prototype = ObjectSchema.prototype;

export interface OptionalObjectSchema<
  TShape extends ObjectShape,
  TContext extends AnyObject = AnyObject,
  TIn extends Maybe<TypeOfShape<TShape>> = TypeOfShape<TShape>
> extends ObjectSchema<TShape, TContext, TIn> {
  default<TNextDefault extends Maybe<AnyObject>>(
    def: TNextDefault | (() => TNextDefault),
  ): TNextDefault extends undefined
    ? ObjectSchema<TShape, TContext, TIn | undefined>
    : ObjectSchema<TShape, TContext, Defined<TIn>>;

  defined(
    msg?: MixedLocale['defined'],
  ): DefinedObjectSchema<TShape, TContext, TIn>;
  required(
    msg?: MixedLocale['required'],
  ): RequiredObjectSchema<TShape, TContext, TIn>;
  optional(): this;
  notRequired(): this;
  nullable(
    isNullable?: true,
  ): OptionalObjectSchema<TShape, TContext, TIn | null>;
  nullable(
    isNullable: false,
  ): OptionalObjectSchema<TShape, TContext, Exclude<TIn, null>>;

  pick<TKey extends keyof TShape>(
    keys: TKey[],
  ): OptionalObjectSchema<
    Pick<TShape, TKey>,
    TContext,
    TypeOfShape<Pick<TShape, TKey>> | Optionals<TIn>
  >;
  omit<TKey extends keyof TShape>(
    keys: TKey[],
  ): OptionalObjectSchema<
    Omit<TShape, TKey>,
    TContext,
    TypeOfShape<Omit<TShape, TKey>> | Optionals<TIn>
  >;
}

export interface DefinedObjectSchema<
  TShape extends ObjectShape,
  TContext extends AnyObject,
  TIn extends Maybe<TypeOfShape<TShape>>
> extends ObjectSchema<
    TShape,
    TContext,
    TIn,
    AssertsShape<TShape> | Extract<TIn, null>
  > {
  default<TNextDefault extends Maybe<AnyObject>>(
    def: TNextDefault | (() => TNextDefault),
  ): TNextDefault extends undefined
    ? DefinedObjectSchema<TShape, TContext, TIn | undefined>
    : DefinedObjectSchema<TShape, TContext, Defined<TIn>>;

  defined(msg?: MixedLocale['defined']): this;
  required(
    msg?: MixedLocale['required'],
  ): RequiredObjectSchema<TShape, TContext, TIn>;

  optional(): OptionalObjectSchema<TShape, TContext, TIn>;
  notRequired(): OptionalObjectSchema<TShape, TContext, TIn>;
  nullable(
    isNullable?: true,
  ): DefinedObjectSchema<TShape, TContext, TIn | null>;
  nullable(
    isNullable: false,
  ): DefinedObjectSchema<TShape, TContext, Exclude<TIn, null>>;

  pick<TKey extends keyof TShape>(
    keys: TKey[],
  ): DefinedObjectSchema<
    Pick<TShape, TKey>,
    TContext,
    TypeOfShape<Pick<TShape, TKey>> | Optionals<TIn>
  >;
  omit<TKey extends keyof TShape>(
    keys: TKey[],
  ): DefinedObjectSchema<
    Omit<TShape, TKey>,
    TContext,
    TypeOfShape<Omit<TShape, TKey>> | Optionals<TIn>
  >;
}

export interface RequiredObjectSchema<
  TShape extends ObjectShape,
  TContext extends AnyObject,
  TIn extends Maybe<TypeOfShape<TShape>>
> extends ObjectSchema<TShape, TContext, TIn, AssertsShape<TShape>> {
  default<TNextDefault extends Maybe<AnyObject>>(
    def: TNextDefault | (() => TNextDefault),
  ): TNextDefault extends undefined
    ? RequiredObjectSchema<TShape, TContext, TIn | undefined>
    : RequiredObjectSchema<TShape, TContext, Defined<TIn>>;

  defined(
    msg?: MixedLocale['defined'],
  ): DefinedObjectSchema<TShape, TContext, TIn>;
  required(msg?: MixedLocale['required']): this;
  optional(): OptionalObjectSchema<TShape, TContext, TIn>;
  notRequired(): OptionalObjectSchema<TShape, TContext, TIn>;
  nullable(
    isNullable?: true,
  ): RequiredObjectSchema<TShape, TContext, TIn | null>;
  nullable(
    isNullable: false,
  ): RequiredObjectSchema<TShape, TContext, Exclude<TIn, null>>;

  pick<TKey extends keyof TShape>(
    keys: TKey[],
  ): RequiredObjectSchema<
    Pick<TShape, TKey>,
    TContext,
    TypeOfShape<Pick<TShape, TKey>> | Optionals<TIn>
  >;
  omit<TKey extends keyof TShape>(
    keys: TKey[],
  ): RequiredObjectSchema<
    Omit<TShape, TKey>,
    TContext,
    TypeOfShape<Omit<TShape, TKey>> | Optionals<TIn>
  >;
}
