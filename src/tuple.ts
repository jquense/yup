// @ts-ignore
import isoParse from './util/isodate';
import { date as locale } from './locale';
import isAbsent from './util/isAbsent';
import Ref from './Reference';
import type {
  AnyObject,
  InternalOptions,
  ISchema,
  Maybe,
  Message,
} from './types';
import type {
  Defined,
  Flags,
  NotNull,
  SetFlag,
  Thunk,
  ToggleDefault,
  UnsetFlag,
} from './util/types';
import Schema, { SchemaSpec } from './schema';

type AnyTuple = [unknown, ...unknown[]];

// type SchemaTuple<T extends AnyTuple> = {
//   [K in keyof T]: ISchema<T[K]>;
// };

export function create<T extends AnyTuple>(schemas: {
  [K in keyof T]: ISchema<T[K]>;
}) {
  return new TupleSchema<T>(schemas);
}

export default interface TupleSchema<
  TType extends Maybe<AnyTuple> = AnyTuple | undefined,
  TContext = AnyObject,
  TDefault = undefined,
  TFlags extends Flags = '',
> extends Schema<TType, TContext, TDefault, TFlags> {
  default<D extends Maybe<TType>>(
    def: Thunk<D>,
  ): TupleSchema<TType, TContext, D, ToggleDefault<TFlags, D>>;

  concat<TOther extends TupleSchema<any, any>>(schema: TOther): TOther;

  defined(
    msg?: Message,
  ): TupleSchema<Defined<TType>, TContext, TDefault, TFlags>;
  optional(): TupleSchema<TType | undefined, TContext, TDefault, TFlags>;

  required(
    msg?: Message,
  ): TupleSchema<NonNullable<TType>, TContext, TDefault, TFlags>;
  notRequired(): TupleSchema<Maybe<TType>, TContext, TDefault, TFlags>;

  nullable(
    msg?: Message,
  ): TupleSchema<TType | null, TContext, TDefault, TFlags>;
  nonNullable(): TupleSchema<NotNull<TType>, TContext, TDefault, TFlags>;

  strip(
    enabled: false,
  ): TupleSchema<TType, TContext, TDefault, UnsetFlag<TFlags, 's'>>;
  strip(
    enabled?: true,
  ): TupleSchema<TType, TContext, TDefault, SetFlag<TFlags, 's'>>;
}

interface TupleSchemaSpec<T> extends SchemaSpec<any> {
  types: T extends any[]
    ? {
        [K in keyof T]: ISchema<T[K]>;
      }
    : never;
}

export default class TupleSchema<
  TType extends Maybe<AnyTuple> = AnyTuple | undefined,
  TContext = AnyObject,
  TDefault = undefined,
  TFlags extends Flags = '',
> extends Schema<TType, TContext, TDefault, TFlags> {
  declare spec: TupleSchemaSpec<TType>;

  constructor(schemas: [ISchema<any>, ...ISchema<any>[]]) {
    super({
      type: 'tuple',
      spec: { types: schemas } as any,
      check(v: any): v is NonNullable<TType> {
        return (
          Array.isArray(v) && v.length === (this.spec as any)!.types!.length
        );
      },
    });
  }

  protected _cast(_value: any, _opts: InternalOptions<TContext>) {
    const { types } = this.spec;

    const value = super._cast(_value, _opts);
    if (!this._typeCheck(value)) {
      return value;
    }

    let isChanged = false;
    const castArray = types.map((type, idx) => {
      const castElement = type.cast(value[idx], {
        ..._opts,
        path: `${_opts.path || ''}[${idx}]`,
      });

      if (castElement !== value[idx]) {
        isChanged = true;
      }

      return castElement;
    });

    return isChanged ? castArray : value;
  }
}

create.prototype = TupleSchema.prototype;
