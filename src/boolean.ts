import Schema from './schema';
import type { AnyObject, DefaultThunk, Message } from './types';
import type {
  Defined,
  Flags,
  NotNull,
  SetFlag,
  ToggleDefault,
  UnsetFlag,
  Maybe,
  Optionals,
} from './util/types';
import { boolean as locale } from './locale';
import isAbsent from './util/isAbsent';

export function create(): BooleanSchema;
export function create<
  T extends boolean,
  TContext extends Maybe<AnyObject> = AnyObject,
>(): BooleanSchema<T | undefined, TContext>;
export function create() {
  return new BooleanSchema();
}

export default class BooleanSchema<
  TType extends Maybe<boolean> = boolean | undefined,
  TContext = AnyObject,
  TDefault = undefined,
  TFlags extends Flags = '',
> extends Schema<TType, TContext, TDefault, TFlags> {
  constructor() {
    super({
      type: 'boolean',
      check(v: any): v is NonNullable<TType> {
        if (v instanceof Boolean) v = v.valueOf();

        return typeof v === 'boolean';
      },
    });

    this.withMutation(() => {
      this.transform((value, _raw, ctx) => {
        if (ctx.spec.coerce && !ctx.isType(value)) {
          if (/^(true|1)$/i.test(String(value))) return true;
          if (/^(false|0)$/i.test(String(value))) return false;
        }
        return value;
      });
    });
  }

  isTrue(
    message = locale.isValue,
  ): BooleanSchema<true | Optionals<TType>, TContext, TFlags> {
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
  ): BooleanSchema<false | Optionals<TType>, TContext, TFlags> {
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
    def: DefaultThunk<D, TContext>,
  ): BooleanSchema<TType, TContext, D, ToggleDefault<TFlags, D>> {
    return super.default(def);
  }

  defined(
    msg?: Message,
  ): BooleanSchema<Defined<TType>, TContext, TDefault, TFlags> {
    return super.defined(msg);
  }
  optional(): BooleanSchema<TType | undefined, TContext, TDefault, TFlags> {
    return super.optional();
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

  strip(
    enabled: false,
  ): BooleanSchema<TType, TContext, TDefault, UnsetFlag<TFlags, 's'>>;
  strip(
    enabled?: true,
  ): BooleanSchema<TType, TContext, TDefault, SetFlag<TFlags, 's'>>;
  strip(v: any) {
    return super.strip(v);
  }
}

create.prototype = BooleanSchema.prototype;
