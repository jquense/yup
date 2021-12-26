import BaseSchema from './schema';
import type { AnyObject, Maybe, Message } from './types';
import type {
  Defined,
  Flags,
  NotNull,
  SetFlag,
  Thunk,
  ToggleDefault,
} from './util/types';
import { boolean as locale } from './locale';
import isAbsent from './util/isAbsent';

export function create(): BooleanSchema;
export function create<
  T extends boolean,
  TContext = AnyObject,
>(): BooleanSchema<T | undefined, TContext>;
export function create() {
  return new BooleanSchema();
}

export default class BooleanSchema<
  TType extends Maybe<boolean> = boolean | undefined,
  TContext = AnyObject,
  TDefault = undefined,
  TFlags extends Flags = '',
> extends BaseSchema<TType, TContext, TDefault, TFlags> {
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

  isTrue(
    message = locale.isValue,
  ): BooleanSchema<TType | true, TContext, TFlags> {
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

  isFalse(
    message = locale.isValue,
  ): BooleanSchema<TType | false, TContext, TFlags> {
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
  ): BooleanSchema<TType, TContext, D, ToggleDefault<TFlags, D>> {
    return super.default(def);
  }

  // concat<TOther extends BooleanSchema<any, any>>(schema: TOther): TOther;
  defined(
    msg?: Message,
  ): BooleanSchema<Defined<TType>, TContext, TDefault, TFlags> {
    return super.defined(msg);
  }
  optional(): BooleanSchema<TType | undefined, TContext, TDefault, TFlags> {
    return super.defined();
  }
  required(
    msg?: Message,
  ): BooleanSchema<NonNullable<TType>, TContext, TDefault, TFlags> {
    return super.required(msg);
  }
  notRequired(): BooleanSchema<Maybe<TType>, TContext, TDefault, TFlags> {
    return super.notRequired();
  }
  nullable(): BooleanSchema<TType | null, TContext, TDefault, TFlags> {
    return super.nullable();
  }
  nonNullable(
    msg?: Message,
  ): BooleanSchema<NotNull<TType>, TContext, TDefault, TFlags> {
    return super.nonNullable(msg);
  }

  strip(): BooleanSchema<TType, TContext, TDefault, SetFlag<TFlags, 's'>> {
    return super.strip();
  }
}

create.prototype = BooleanSchema.prototype;
