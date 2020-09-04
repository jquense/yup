import has from 'lodash/has';
import snakeCase from 'lodash/snakeCase';
import camelCase from 'lodash/camelCase';
import mapKeys from 'lodash/mapKeys';
import mapValues from 'lodash/mapValues';
import { getter } from 'property-expr';

import MixedSchema, { SchemaSpec } from './mixed';
import { object as locale, string } from './locale';
import sortFields from './util/sortFields';
import sortByKeyOrder from './util/sortByKeyOrder';
import runTests from './util/runTests';
import Schema, { CastOptions, SchemaObjectDescription } from './Schema';
import { InternalOptions, Callback, Maybe } from './types';
import { ValidationError } from '.';
import {
  ResolveInput,
  ResolveOutput,
  TypeDef,
  SetNullability,
  SetPresence,
  TypedSchema,
} from './util/types';

let isObject = (obj: any): obj is Record<PropertyKey, unknown> =>
  Object.prototype.toString.call(obj) === '[object Object]';

function unknown(ctx: ObjectSchema, value: any) {
  let known = Object.keys(ctx.fields);
  return Object.keys(value).filter((key) => known.indexOf(key) === -1);
}

type ObjectShape = Record<string, TypedSchema>;

// type Obj = Record<string, unknown>;

export function create<TShape extends ObjectShape>(spec?: TShape) {
  return new ObjectSchema<TShape>(spec);
}

export type TypeFromShape<Shape extends ObjectShape> = {
  [K in keyof Shape]: Shape[K] extends MixedSchema<infer TType>
    ? TType
    : // not sure why this is necessary
    Shape[K] extends ObjectSchema<infer TShape>
    ? TypeFromShape<TShape>
    : never;
};

export type DefaultFromShape<Shape extends ObjectShape> = {
  [K in keyof Shape]: Shape[K] extends MixedSchema<any, any, infer TDefault>
    ? TDefault
    : never;
};

export type TypeOfShape<Shape extends ObjectShape> = {
  [K in keyof Shape]: Shape[K]['__inputType'];
};

export type AssertsShape<Shape extends ObjectShape> = {
  [K in keyof Shape]: Shape[K]['__outputType'];
};

// export default interface ObjectSchema<TShape extends ObjectShape = ObjectShape>
//   extends MixedSchema {
//   cast(value: any, options?: any): TypeOfShape<this, ObjectShape>;

//   // validate(value: any, options?: any): Promise<AssertsShape<ObjectShape>>;
// }

export default class ObjectSchema<
  TShape extends ObjectShape = ObjectShape,
  TDef extends TypeDef = 'optional' | 'nonnullable',
  TDefault extends Maybe<TypeFromShape<TShape>> = DefaultFromShape<TShape>
> extends MixedSchema<TypeFromShape<TShape>, TDef, TDefault> {
  fields: TShape;

  __inputType!: ResolveInput<TypeOfShape<TShape>, TDef, TDefault>;
  __outputType!: ResolveOutput<AssertsShape<TShape>, TDef, TDefault>;

  // _shape!: TShape;
  // _tsType!: TypeOfShape<TShape>;
  // _tsValidate!: AssertsShape<TShape>;

  // spec!: SchemaSpec & {
  //   noUnknown: boolean;
  // };

  private _sortErrors: (a: ValidationError, b: ValidationError) => number;
  private _nodes: string[];
  private _excludedEdges: string[];

  constructor(spec?: TShape) {
    super({
      type: 'object',
      spec: {
        noUnknown: false,
        default(this: ObjectSchema<any>) {
          if (!this._nodes.length) return undefined;

          let dft = {} as Record<string, unknown>;
          this._nodes.forEach((key) => {
            dft[key] =
              'default' in this.fields[key]
                ? this.fields[key].default()
                : undefined;
          });
          return dft as any;
        },
      },
    });

    this.fields = Object.create(null);

    this._sortErrors = sortByKeyOrder([]);

    this._nodes = [];
    this._excludedEdges = [];

    this.withMutation(() => {
      // this.spec.default = () => {};

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

  protected _typeCheck(value: any): value is Record<string, unknown> {
    return isObject(value) || typeof value === 'function';
  }

  protected _cast(_value: any, options: InternalOptions = {}) {
    let value = super._cast(_value, options);

    //should ignore nulls here
    if (value === undefined) return this.default();

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
    // let endEarly = options.abortEarly ?? this.spec.abortEarly;
    // let recursive = options.recursive ?? this.spec.recursive;

    let isChanged = false;
    for (const prop of props) {
      let field = fields[prop];
      let exists = has(value, prop);

      if (field) {
        let fieldValue;
        let strict = field.spec?.strict;

        let inputValue = value[prop];

        // safe to mutate since this is fired in sequence
        innerOptions.path = (options.path ? `${options.path}.` : '') + prop;
        // innerOptions.value = value[prop];

        field = field.resolve({
          value: inputValue,
          context: options.context,
          parent: intermediateValue,
        });

        if (field.spec?.strip) {
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
    opts: InternalOptions = {},
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

        if (field && field.validate) {
          (field as Schema).validate(
            value[key],
            {
              ...opts,
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

  concat(schema: ObjectSchema): ObjectSchema {
    var next = super.concat(schema) as ObjectSchema;

    next._nodes = sortFields(next.fields, next._excludedEdges);

    return next;
  }

  shape<TNextShape extends ObjectShape>(
    additions: TNextShape,
    excludes: [string, string][] = [],
  ): ObjectSchema<TShape & TNextShape> {
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

type AnyObject = Record<string, any>;

// @ts-ignore
export default interface ObjectSchema<
  TShape extends ObjectShape,
  TDef extends TypeDef,
  TDefault extends Maybe<TypeFromShape<TShape>>
> extends MixedSchema<TypeFromShape<TShape>, TDef, TDefault> {
  default(): TDefault;
  default<TNextDefault extends Maybe<TypeFromShape<TShape>>>(
    def: TNextDefault | (() => TNextDefault),
  ): ObjectSchema<TShape, TDef, TNextDefault>;

  required(): ObjectSchema<TShape, SetPresence<TDef, 'required'>, TDefault>;
  notRequired(): ObjectSchema<TShape, SetPresence<TDef, 'optional'>, TDefault>;

  nullable(
    isNullable?: true,
  ): ObjectSchema<TShape, SetNullability<TDef, 'nullable'>, TDefault>;
  nullable(
    isNullable: false,
  ): ObjectSchema<TShape, SetNullability<TDef, 'nonnullable'>, TDefault>;
}
