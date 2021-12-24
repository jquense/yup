// // @ts-ignore
// import { getter, normalizePath, join } from 'property-expr';
// import { camelCase, snakeCase } from 'tiny-case';

// import { object as locale } from './locale';
// import sortFields from './util/sortFields';
// import sortByKeyOrder from './util/sortByKeyOrder';
// import runTests from './util/runTests';
// import {
//   InternalOptions,
//   Callback,
//   Maybe,
//   Optionals,
//   Preserve,
//   Message,
// } from './types';
// import ValidationError from './ValidationError';
// import type {
//   TypedSchema,
//   Defined,
//   Thunk,
//   Config,
//   NotNull,
//   ToggleDefault,
//   _,
//   MakePartial,
//   AnyConfig,
// } from './util/types';
// import type Reference from './Reference';
// import Lazy from './Lazy';
// import BaseSchema, {
//   AnySchema,
//   ResolveFlags,
//   SchemaObjectDescription,
//   SchemaSpec,
// } from './schema';
// import { ResolveOptions } from './Condition';

// export type Assign<T extends {}, U extends {}> = {
//   [P in keyof T]: P extends keyof U ? U[P] : T[P];
// } & U;

// export type AnyObject = Record<string, any>;

// export type ObjectShape = { [k: string]: TypedSchema | Reference };

// // type FieldType<
// //   T extends AnySchema | Reference | Lazy<any, any>,
// //   F extends '__type' | '__outputType',
// // > = T extends TypedSchema ? T[F] : T extends Reference ? unknown : never;

// // export type DefaultFromShape<Shape extends ObjectShape> = {
// //   [K in keyof Shape]: Shape[K] extends ObjectSchema<infer TShape>
// //     ? DefaultFromShape<TShape>
// //     : Shape[K] extends { getDefault: () => infer D }
// //     ? Preserve<D, undefined> extends never
// //       ? Defined<D>
// //       : Preserve<D, undefined>
// //     : undefined;
// // };

// // export type TypeOfShape<Shape extends ObjectShape> = {
// //   [K in keyof Shape]: FieldType<Shape[K], '__type'>;
// // };

// // type Strip<K, V> = V extends AnySchema
// //   ? HasFlag<V, 's'> extends never
// //     ? K
// //     : never
// //   : K;

// export type ObjectOutput<Shape extends ObjectShape> = {
//   [K in keyof Shape]: Shape[K] extends TypedSchema
//     ? Shape[K]['__outputType']
//     : unknown;
// };

// // export type PartialSchema<S extends ObjectShape> = {
// //   [K in keyof S]: S[K] extends BaseSchema ? ReturnType<S[K]['optional']> : S[K];
// // };

// // export type DeepPartialSchema<S extends ObjectShape> = {
// //   [K in keyof S]: S[K] extends ObjectSchema<any, any, any>
// //     ? ReturnType<S[K]['deepPartial']>
// //     : S[K] extends BaseSchema
// //     ? ReturnType<S[K]['optional']>
// //     : S[K];
// // };

// export type ObjectSchemaSpec = SchemaSpec<any> & {
//   noUnknown?: boolean;
// };

// const deepHas = (obj: any, p: string) => {
//   const path = [...normalizePath(p)];
//   if (path.length === 1) return path[0] in obj;
//   let last = path.pop()!;
//   let parent = getter(join(path), true)(obj);
//   return !!(parent && last in parent);
// };

// let isObject = (obj: any): obj is Record<PropertyKey, unknown> =>
//   Object.prototype.toString.call(obj) === '[object Object]';

// function unknown(ctx: ObjectSchema<any, any, any>, value: any) {
//   let known = Object.keys(ctx.fields);
//   return Object.keys(value).filter((key) => known.indexOf(key) === -1);
// }

// const defaultSort = sortByKeyOrder([]);

// export default class ObjectSchema<
//   TShape extends ObjectShape,
//   TConfig extends AnyConfig = Config<AnyObject, 'd'>,
//   TIn = AssertsShape<TShape> | undefined,
// > extends BaseSchema<TIn, TConfig> {
//   fields: TShape = Object.create(null);

//   declare spec: ObjectSchemaSpec;

//   // declare readonly __outputType: ResolveFlags<TIn, TConfig['flags']>;

//   private _sortErrors = defaultSort;
//   private _nodes: readonly string[] = [];

//   private _excludedEdges: readonly [nodeA: string, nodeB: string][] = [];

//   constructor(spec?: TShape) {
//     super({
//       type: 'object',
//     });

//     this.withMutation(() => {
//       this.transform(function coerce(value) {
//         if (typeof value === 'string') {
//           try {
//             value = JSON.parse(value);
//           } catch (err) {
//             value = null;
//           }
//         }
//         if (this.isType(value)) return value;
//         return null;
//       });

//       if (spec) {
//         this.shape(spec);
//       }
//     });
//   }

//   protected _typeCheck(value: any): value is NonNullable<TIn> {
//     return isObject(value) || typeof value === 'function';
//   }

//   protected _cast(
//     _value: any,
//     options: InternalOptions<TConfig['context']> = {},
//   ) {
//     let value = super._cast(_value, options);

//     //should ignore nulls here
//     if (value === undefined) return this.getDefault();

//     if (!this._typeCheck(value)) return value;

//     let fields = this.fields;

//     let strip = options.stripUnknown ?? this.spec.noUnknown;
//     let props = this._nodes.concat(
//       Object.keys(value).filter((v) => this._nodes.indexOf(v) === -1),
//     );

//     let intermediateValue: Record<string, unknown> = {}; // is filled during the transform below
//     let innerOptions: InternalOptions = {
//       ...options,
//       parent: intermediateValue,
//       __validating: options.__validating || false,
//     };

//     let isChanged = false;
//     for (const prop of props) {
//       let field = fields[prop];
//       let exists = prop in value!;

//       if (field) {
//         let fieldValue;
//         let inputValue = value[prop];

//         // safe to mutate since this is fired in sequence
//         innerOptions.path = (options.path ? `${options.path}.` : '') + prop;
//         // innerOptions.value = value[prop];

//         field = field.resolve({
//           value: inputValue,
//           context: options.context,
//           parent: intermediateValue,
//         });

//         let fieldSpec = field instanceof BaseSchema ? field.spec : undefined;
//         let strict = fieldSpec?.strict;

//         if (fieldSpec?.strip) {
//           isChanged = isChanged || prop in value;
//           continue;
//         }

//         fieldValue =
//           !options.__validating || !strict
//             ? // TODO: use _cast, this is double resolving
//               field.cast(value[prop], innerOptions)
//             : value[prop];

//         if (fieldValue !== undefined) {
//           intermediateValue[prop] = fieldValue;
//         }
//       } else if (exists && !strip) {
//         intermediateValue[prop] = value[prop];
//       }

//       if (intermediateValue[prop] !== value[prop]) {
//         isChanged = true;
//       }
//     }

//     return isChanged ? intermediateValue : value;
//   }

//   protected _validate(
//     _value: any,
//     opts: InternalOptions<TConfig['context']> = {},
//     callback: Callback,
//   ) {
//     let errors = [] as ValidationError[];
//     let {
//       sync,
//       from = [],
//       originalValue = _value,
//       abortEarly = this.spec.abortEarly,
//       recursive = this.spec.recursive,
//     } = opts;

//     from = [{ schema: this, value: originalValue }, ...from];

//     // this flag is needed for handling `strict` correctly in the context of
//     // validation vs just casting. e.g strict() on a field is only used when validating
//     opts.__validating = true;
//     opts.originalValue = originalValue;
//     opts.from = from;

//     super._validate(_value, opts, (err, value) => {
//       if (err) {
//         if (!ValidationError.isError(err) || abortEarly) {
//           return void callback(err, value);
//         }
//         errors.push(err);
//       }

//       if (!recursive || !isObject(value)) {
//         callback(errors[0] || null, value);
//         return;
//       }

//       originalValue = originalValue || value;

//       let tests = this._nodes.map((key) => (__: any, cb: Callback) => {
//         let path =
//           key.indexOf('.') === -1
//             ? (opts.path ? `${opts.path}.` : '') + key
//             : `${opts.path || ''}["${key}"]`;

//         let field = this.fields[key];

//         if (field && 'validate' in field) {
//           field.validate(
//             value[key],
//             {
//               ...opts,
//               // @ts-ignore
//               path,
//               from,
//               // inner fields are always strict:
//               // 1. this isn't strict so the casting will also have cast inner values
//               // 2. this is strict in which case the nested values weren't cast either
//               strict: true,
//               parent: value,
//               originalValue: originalValue[key],
//             },
//             cb,
//           );
//           return;
//         }

//         cb(null);
//       });

//       runTests(
//         {
//           sync,
//           tests,
//           value,
//           errors,
//           endEarly: abortEarly,
//           sort: this._sortErrors,
//           path: opts.path,
//         },
//         callback,
//       );
//     });
//   }

//   clone(spec?: ObjectSchemaSpec): this {
//     const next = super.clone(spec);
//     next.fields = { ...this.fields };
//     next._nodes = this._nodes;
//     next._excludedEdges = this._excludedEdges;
//     next._sortErrors = this._sortErrors;

//     return next;
//   }

//   concat<TOther extends ObjectSchema<any, any, any>>(
//     schema: TOther,
//   ): TOther extends ObjectSchema<infer S, infer C, infer IType>
//     ? ObjectSchema<
//         TShape & S,
//         TConfig & C,
//         AssertsShape<TShape & S> | Optionals<IType>
//       >
//     : never;
//   concat(schema: this): this;
//   concat(schema: any): any {
//     let next = super.concat(schema) as any;

//     let nextFields = next.fields;
//     for (let [field, schemaOrRef] of Object.entries(this.fields)) {
//       const target = nextFields[field];
//       if (target === undefined) {
//         nextFields[field] = schemaOrRef;
//       } else if (
//         target instanceof BaseSchema &&
//         schemaOrRef instanceof BaseSchema
//       ) {
//         nextFields[field] = schemaOrRef.concat(target);
//       }
//     }

//     return next.withMutation((s: any) =>
//       s.setFields(nextFields, this._excludedEdges),
//     );
//   }

//   protected _getDefault() {
//     if ('default' in this.spec) {
//       return super._getDefault();
//     }

//     // if there is no default set invent one
//     if (!this._nodes.length) {
//       return undefined;
//     }

//     return this.getDefaultFromShape();
//   }
//   // FIXME
//   getDefaultFromShape(): any {
//     let dft = {} as Record<string, unknown>;
//     this._nodes.forEach((key) => {
//       const field = this.fields[key];
//       dft[key] = 'default' in field ? field.getDefault() : undefined;
//     });
//     return dft as any;
//   }

//   private setFields<S extends ObjectShape>(
//     shape: S,
//     excludedEdges?: readonly [string, string][],
//   ): ObjectSchema<S, TConfig, AssertsShape<S> | Optionals<TIn>> {
//     let next = this.clone() as any;
//     next.fields = shape;

//     next._nodes = sortFields(shape, excludedEdges);
//     next._sortErrors = sortByKeyOrder(Object.keys(shape));
//     // XXX: this carries over edges which may not be what you want
//     if (excludedEdges) next._excludedEdges = excludedEdges;
//     return next;
//   }

//   shape<TNextShape extends ObjectShape>(
//     additions: TNextShape,
//     excludes: [string, string][] = [],
//   ) {
//     return this.clone().withMutation((next) => {
//       let edges = next._excludedEdges;
//       if (excludes.length) {
//         if (!Array.isArray(excludes[0])) excludes = [excludes as any];

//         edges = [...next._excludedEdges, ...excludes];
//       }

//       // XXX: excludes here is wrong
//       return next.setFields(
//         Object.assign(next.fields, additions) as Assign<TShape, TNextShape>,
//         edges,
//       );
//     });
//   }

//   // partial() {
//   //   const partial: any = {};
//   //   for (const [key, schema] of Object.entries(this.fields)) {
//   //     partial[key] = schema instanceof BaseSchema ? schema.optional() : schema;
//   //   }

//   //   return this.setFields(partial as PartialSchema<TShape>);
//   // }

//   // deepPartial(): ObjectSchema<
//   //   DeepPartialSchema<TShape>,
//   //   TConfig,
//   //   Optionals<TIn> | undefined | AssertsShape<DeepPartialSchema<TShape>>
//   // > {
//   //   const partial: any = {};
//   //   for (const [key, schema] of Object.entries(this.fields)) {
//   //     if (schema instanceof ObjectSchema) partial[key] = schema.deepPartial();
//   //     else
//   //       partial[key] =
//   //         schema instanceof BaseSchema ? schema.optional() : schema;
//   //   }
//   //   return this.setFields(partial as DeepPartialSchema<TShape>);
//   // }

//   // pick<TKey extends keyof TShape>(keys: TKey[]) {
//   //   const picked: any = {};
//   //   for (const key of keys) {
//   //     if (this.fields[key]) picked[key] = this.fields[key];
//   //   }

//   //   return this.setFields(picked as Pick<TShape, TKey>);
//   // }

//   // omit<TKey extends keyof TShape>(keys: TKey[]) {
//   //   const fields = { ...this.fields };

//   //   for (const key of keys) {
//   //     delete fields[key];
//   //   }

//   //   return this.setFields(fields as Omit<TShape, TKey>);
//   // }

//   from(from: string, to: keyof TShape, alias?: boolean) {
//     let fromGetter = getter(from, true);

//     return this.transform((obj) => {
//       if (!obj) return obj;
//       let newObj = obj;
//       if (deepHas(obj, from)) {
//         newObj = { ...obj };
//         if (!alias) delete newObj[from];

//         newObj[to] = fromGetter(obj);
//       }

//       return newObj;
//     });
//   }

//   noUnknown(noAllow = true, message = locale.noUnknown) {
//     if (typeof noAllow === 'string') {
//       message = noAllow;
//       noAllow = true;
//     }

//     let next = this.test({
//       name: 'noUnknown',
//       exclusive: true,
//       message: message,
//       test(value) {
//         if (value == null) return true;
//         const unknownKeys = unknown(this.schema, value);
//         return (
//           !noAllow ||
//           unknownKeys.length === 0 ||
//           this.createError({ params: { unknown: unknownKeys.join(', ') } })
//         );
//       },
//     });

//     next.spec.noUnknown = noAllow;

//     return next;
//   }

//   unknown(allow = true, message = locale.noUnknown) {
//     return this.noUnknown(!allow, message);
//   }

//   transformKeys(fn: (key: string) => string) {
//     return this.transform((obj) => {
//       if (!obj) return obj;
//       const result: AnyObject = {};
//       for (const key of Object.keys(obj)) result[fn(key)] = obj[key];
//       return result;
//     });
//   }

//   camelCase() {
//     return this.transformKeys(camelCase);
//   }

//   snakeCase() {
//     return this.transformKeys(snakeCase);
//   }

//   constantCase() {
//     return this.transformKeys((key) => snakeCase(key).toUpperCase());
//   }

//   describe(options?: ResolveOptions<TConfig['context']>) {
//     let base = super.describe(options) as SchemaObjectDescription;
//     base.fields = {};
//     for (const [key, value] of Object.entries(this.fields)) {
//       let innerOptions = options;
//       if (innerOptions?.value) {
//         innerOptions = {
//           ...innerOptions,
//           parent: innerOptions.value,
//           value: innerOptions.value[key],
//         };
//       }
//       base.fields[key] = value.describe(innerOptions);
//     }
//     return base;
//   }
// }

// export function create<TShape extends ObjectShape = {}>(spec?: TShape) {
//   return new ObjectSchema<TShape>(spec);
// }

// create.prototype = ObjectSchema.prototype;

// export default interface ObjectSchema<
//   TShape extends ObjectShape,
//   TConfig extends Config<any, any> = Config<AnyObject, 'd'>,
//   TIn extends Maybe<AssertsShape<TShape>> = AssertsShape<TShape> | undefined,
// > extends BaseSchema<TIn, TConfig> {
//   default<D extends Maybe<AnyObject>>(
//     def: Thunk<D>,
//   ): ObjectSchema<TShape, ToggleDefault<TConfig, D>, TIn>;

//   defined(msg?: Message): ObjectSchema<TShape, TConfig, Defined<TIn>>;
//   optional(): ObjectSchema<TShape, TConfig, TIn | undefined>;

//   required(msg?: Message): ObjectSchema<TShape, TConfig, NonNullable<TIn>>;
//   notRequired(): ObjectSchema<TShape, TConfig, Maybe<TIn>>;

//   nullable(isNullable?: true): ObjectSchema<TShape, TConfig, TIn | null>;
//   nullable(isNullable: false): ObjectSchema<TShape, TConfig, NotNull<TIn>>;
// }
