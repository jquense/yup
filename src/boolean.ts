import BaseSchema from './schema';
import type { AnyObject, Maybe, Message } from './types';
import type {
  Config,
  Defined,
  NotNull,
  Thunk,
  ToggleDefault,
} from './util/types';
import { boolean as locale } from './locale';
import isAbsent from './util/isAbsent';

export function create(): BooleanSchema;
export function create<
  T extends boolean,
  TContext = AnyObject,
>(): BooleanSchema<T | undefined, Config<TContext>>;
export function create() {
  return new BooleanSchema();
}

export default class BooleanSchema<
  TType extends Maybe<boolean> = boolean | undefined,
  TConfig extends Config<any, any> = Config,
> extends BaseSchema<TType, TConfig> {
  constructor() {
    super({ type: 'boolean' });

    this.withMutation(() => {
      this.transform(function (value) {
        if (!this.isType(value)) {
          if (/^(true|1)$/i.test(String(value))) return true;
          if (/^(false|0)$/i.test(String(value))) return false;
        }
        return value;
      });
    });
  }

  protected _typeCheck(v: any): v is NonNullable<TType> {
    if (v instanceof Boolean) v = v.valueOf();

    return typeof v === 'boolean';
  }

  isTrue(message = locale.isValue): BooleanSchema<TType | true, TConfig> {
    return this.test({
      message,
      name: 'is-value',
      exclusive: true,
      params: { value: 'true' },
      test(value) {
        return isAbsent(value) || value === true;
      },
    }) as any;
  }

  isFalse(message = locale.isValue): BooleanSchema<TType | false, TConfig> {
    return this.test({
      message,
      name: 'is-value',
      exclusive: true,
      params: { value: 'false' },
      test(value) {
        return isAbsent(value) || value === false;
      },
    }) as any;
  }

  override default<D extends Maybe<TType>>(
    def: Thunk<D>,
  ): BooleanSchema<TType, ToggleDefault<TConfig, D>> {
    return super.default(def);
  }

  // concat<TOther extends BooleanSchema<any, any>>(schema: TOther): TOther;

  // defined(msg?: Message): BooleanSchema<Defined<TType>, TConfig>;
  // optional(): BooleanSchema<TType | undefined, TConfig>;

  // required(msg?: Message): BooleanSchema<NonNullable<TType>, TConfig>;
  // declarenotRequired(): BooleanSchema<Maybe<TType>, TConfig>;

  // nullable(msg?: Message): BooleanSchema<TType | null, TConfig>;
  // nonNullable(): BooleanSchema<NotNull<TType>, TConfig>;
}

create.prototype = BooleanSchema.prototype;
