import { MixedLocale, string as locale } from './locale';
import isAbsent from './util/isAbsent';
import type Reference from './Reference';
import type { Message, Maybe, AnyObject, Optionals } from './types';
import type {
  Concat,
  Defined,
  Flags,
  NotNull,
  SetFlag,
  Thunk,
  ToggleDefault,
  UnsetFlag,
} from './util/types';
import BaseSchema from './schema';

let rEmail =
  // eslint-disable-next-line
  /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;

let rUrl =
  // eslint-disable-next-line
  /^((https?|ftp):)?\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;

// eslint-disable-next-line
let rUUID =
  /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;

let isTrimmed = (value: Maybe<string>) =>
  isAbsent(value) || value === value.trim();

export type MatchOptions = {
  excludeEmptyString?: boolean;
  message: Message<{ regex: RegExp }>;
  name?: string;
};

let objStringTag = {}.toString();

function create(): StringSchema;
function create<T extends string, TContext = AnyObject>(): StringSchema<
  T | undefined,
  TContext
>;
function create() {
  return new StringSchema();
}

export { create };

export default class StringSchema<
  TType extends Maybe<string> = string | undefined,
  TContext = AnyObject,
  TDefault = undefined,
  TFlags extends Flags = '',
> extends BaseSchema<TType, TContext, TDefault, TFlags> {
  constructor() {
    super({ type: 'string' });

    this.withMutation(() => {
      this.transform(function (value) {
        if (this.isType(value)) return value;
        if (Array.isArray(value)) return value;

        const strValue =
          value != null && value.toString ? value.toString() : value;

        if (strValue === objStringTag) return value;

        return strValue;
      });
    });
  }

  protected _typeCheck(value: any): value is NonNullable<TType> {
    if (value instanceof String) value = value.valueOf();

    return typeof value === 'string';
  }

  protected _isPresent(value: any) {
    return super._isPresent(value) && !!value.length;
  }

  length(
    length: number | Reference<number>,
    message: Message<{ length: number }> = locale.length,
  ) {
    return this.test({
      message,
      name: 'length',
      exclusive: true,
      params: { length },
      test(value: Maybe<string>) {
        return isAbsent(value) || value.length === this.resolve(length);
      },
    });
  }

  min(
    min: number | Reference<number>,
    message: Message<{ min: number }> = locale.min,
  ) {
    return this.test({
      message,
      name: 'min',
      exclusive: true,
      params: { min },
      test(value: Maybe<string>) {
        return isAbsent(value) || value.length >= this.resolve(min);
      },
    });
  }

  max(
    max: number | Reference<number>,
    message: Message<{ max: number }> = locale.max,
  ) {
    return this.test({
      name: 'max',
      exclusive: true,
      message,
      params: { max },
      test(value: Maybe<string>) {
        return isAbsent(value) || value.length <= this.resolve(max);
      },
    });
  }

  matches(regex: RegExp, options?: MatchOptions | MatchOptions['message']) {
    let excludeEmptyString = false;
    let message;
    let name;

    if (options) {
      if (typeof options === 'object') {
        ({
          excludeEmptyString = false,
          message,
          name,
        } = options as MatchOptions);
      } else {
        message = options;
      }
    }

    return this.test({
      name: name || 'matches',
      message: message || locale.matches,
      params: { regex },
      test: (value: Maybe<string>) =>
        isAbsent(value) ||
        (value === '' && excludeEmptyString) ||
        value.search(regex) !== -1,
    });
  }

  email(message = locale.email) {
    return this.matches(rEmail, {
      name: 'email',
      message,
      excludeEmptyString: true,
    });
  }

  url(message = locale.url) {
    return this.matches(rUrl, {
      name: 'url',
      message,
      excludeEmptyString: true,
    });
  }

  uuid(message = locale.uuid) {
    return this.matches(rUUID, {
      name: 'uuid',
      message,
      excludeEmptyString: false,
    });
  }

  //-- transforms --
  ensure(): StringSchema<NonNullable<TType>> {
    return this.default('' as Defined<TType>).transform((val) =>
      val === null ? '' : val,
    ) as any;
  }

  trim(message = locale.trim) {
    return this.transform((val) => (val != null ? val.trim() : val)).test({
      message,
      name: 'trim',
      test: isTrimmed,
    });
  }

  lowercase(message = locale.lowercase) {
    return this.transform((value) =>
      !isAbsent(value) ? value.toLowerCase() : value,
    ).test({
      message,
      name: 'string_case',
      exclusive: true,
      test: (value: Maybe<string>) =>
        isAbsent(value) || value === value.toLowerCase(),
    });
  }

  uppercase(message = locale.uppercase) {
    return this.transform((value) =>
      !isAbsent(value) ? value.toUpperCase() : value,
    ).test({
      message,
      name: 'string_case',
      exclusive: true,
      test: (value: Maybe<string>) =>
        isAbsent(value) || value === value.toUpperCase(),
    });
  }
}

create.prototype = StringSchema.prototype;

//
// String Interfaces
//

export default interface StringSchema<
  TType extends Maybe<string> = string | undefined,
  TContext = AnyObject,
  TDefault = undefined,
  TFlags extends Flags = '',
> extends BaseSchema<TType, TContext, TDefault, TFlags> {
  default<D extends Maybe<TType>>(
    def: Thunk<D>,
  ): StringSchema<TType, TContext, D, ToggleDefault<TFlags, D>>;

  oneOf<U extends TType>(
    arrayOfValues: ReadonlyArray<U | Reference>,
    message?: MixedLocale['oneOf'],
  ): StringSchema<U | Optionals<TType>, TContext, TDefault, TFlags>;

  concat<UType extends Maybe<string>, UContext, UDefault, UFlags extends Flags>(
    schema: StringSchema<UType, UContext, UDefault, UFlags>,
  ): StringSchema<
    Concat<TType, UType>,
    TContext & UContext,
    UDefault,
    TFlags | UFlags
  >;
  concat(schema: this): this;

  defined(
    msg?: Message,
  ): StringSchema<Defined<TType>, TContext, TDefault, TFlags>;
  optional(): StringSchema<TType | undefined, TContext, TDefault, TFlags>;

  required(
    msg?: Message,
  ): StringSchema<NonNullable<TType>, TContext, TDefault, TFlags>;
  notRequired(): StringSchema<Maybe<TType>, TContext, TDefault, TFlags>;

  nullable(
    msg?: Message<any>,
  ): StringSchema<TType | null, TContext, TDefault, TFlags>;
  nonNullable(): StringSchema<NotNull<TType>, TContext, TDefault, TFlags>;

  strip(
    enabled: false,
  ): StringSchema<TType, TContext, TDefault, UnsetFlag<TFlags, 's'>>;
  strip(
    enabled?: true,
  ): StringSchema<TType, TContext, TDefault, SetFlag<TFlags, 's'>>;
}
