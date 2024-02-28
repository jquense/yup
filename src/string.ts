import { MixedLocale, mixed as mixedLocale, string as locale } from './locale';
import isAbsent from './util/isAbsent';
import type Reference from './Reference';
import type { Message, AnyObject, DefaultThunk } from './types';
import type {
  Concat,
  Defined,
  Flags,
  NotNull,
  SetFlag,
  ToggleDefault,
  UnsetFlag,
  Maybe,
  Optionals,
} from './util/types';
import Schema from './schema';
import { parseDateStruct } from './util/parseIsoDate';

// Taken from HTML spec: https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address
let rEmail =
  // eslint-disable-next-line
  /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

let rUrl =
  // eslint-disable-next-line
  /^((https?|ftp):)?\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;

// eslint-disable-next-line
let rUUID =
  /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;

let yearMonthDay = '^\\d{4}-\\d{2}-\\d{2}';
let hourMinuteSecond = '\\d{2}:\\d{2}:\\d{2}';
let zOrOffset = '(([+-]\\d{2}(:?\\d{2})?)|Z)';
let rIsoDateTime = new RegExp(
  `${yearMonthDay}T${hourMinuteSecond}(\\.\\d+)?${zOrOffset}$`,
);

let isTrimmed = (value: Maybe<string>) =>
  isAbsent(value) || value === value.trim();

export type MatchOptions = {
  excludeEmptyString?: boolean;
  message: Message<{ regex: RegExp }>;
  name?: string;
};

export type DateTimeOptions = {
  message: Message<{ allowOffset?: boolean; precision?: number }>;
  /** Allow a time zone offset. False requires UTC 'Z' timezone. (default: false) */
  allowOffset?: boolean;
  /** Require a certain sub-second precision on the date. (default: undefined -- any or no sub-second precision) */
  precision?: number;
};

let objStringTag = {}.toString();

function create(): StringSchema;
function create<
  T extends string,
  TContext extends Maybe<AnyObject> = AnyObject,
>(): StringSchema<T | undefined, TContext>;
function create() {
  return new StringSchema();
}

export { create };

export default class StringSchema<
  TType extends Maybe<string> = string | undefined,
  TContext = AnyObject,
  TDefault = undefined,
  TFlags extends Flags = '',
> extends Schema<TType, TContext, TDefault, TFlags> {
  constructor() {
    super({
      type: 'string',
      check(value): value is NonNullable<TType> {
        if (value instanceof String) value = value.valueOf();
        return typeof value === 'string';
      },
    });

    this.withMutation(() => {
      this.transform((value, _raw, ctx) => {
        if (!ctx.spec.coerce || ctx.isType(value)) return value;

        // don't ever convert arrays
        if (Array.isArray(value)) return value;

        const strValue =
          value != null && value.toString ? value.toString() : value;

        // no one wants plain objects converted to [Object object]
        if (strValue === objStringTag) return value;

        return strValue;
      });
    });
  }

  required(message?: Message<any>) {
    return super.required(message).withMutation((schema: this) =>
      schema.test({
        message: message || mixedLocale.required,
        name: 'required',
        skipAbsent: true,
        test: (value) => !!value!.length,
      }),
    );
  }

  notRequired() {
    return super.notRequired().withMutation((schema: this) => {
      schema.tests = schema.tests.filter((t) => t.OPTIONS!.name !== 'required');
      return schema;
    });
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
      skipAbsent: true,
      test(value: Maybe<string>) {
        return value!.length === this.resolve(length);
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
      skipAbsent: true,
      test(value: Maybe<string>) {
        return value!.length >= this.resolve(min);
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
      skipAbsent: true,
      test(value: Maybe<string>) {
        return value!.length <= this.resolve(max);
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
      skipAbsent: true,
      test: (value: Maybe<string>) =>
        (value === '' && excludeEmptyString) || value!.search(regex) !== -1,
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

  datetime(options?: DateTimeOptions | DateTimeOptions['message']) {
    let message: DateTimeOptions['message'] = '';
    let allowOffset: DateTimeOptions['allowOffset'];
    let precision: DateTimeOptions['precision'];

    if (options) {
      if (typeof options === 'object') {
        ({
          message = '',
          allowOffset = false,
          precision = undefined,
        } = options as DateTimeOptions);
      } else {
        message = options;
      }
    }

    return this.matches(rIsoDateTime, {
      name: 'datetime',
      message: message || locale.datetime,
      excludeEmptyString: true,
    })
      .test({
        name: 'datetime_offset',
        message: message || locale.datetime_offset,
        params: { allowOffset },
        skipAbsent: true,
        test: (value: Maybe<string>) => {
          if (!value || allowOffset) return true;
          const struct = parseDateStruct(value);
          if (!struct) return false;
          return !!struct.z;
        },
      })
      .test({
        name: 'datetime_precision',
        message: message || locale.datetime_precision,
        params: { precision },
        skipAbsent: true,
        test: (value: Maybe<string>) => {
          if (!value || precision == undefined) return true;
          const struct = parseDateStruct(value);
          if (!struct) return false;
          return struct.precision === precision;
        },
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
      skipAbsent: true,
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
      skipAbsent: true,
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
> extends Schema<TType, TContext, TDefault, TFlags> {
  default<D extends Maybe<TType>>(
    def: DefaultThunk<D, TContext>,
  ): StringSchema<TType, TContext, D, ToggleDefault<TFlags, D>>;

  oneOf<U extends TType>(
    arrayOfValues: ReadonlyArray<U | Reference<U>>,
    message?: MixedLocale['oneOf'],
  ): StringSchema<U | Optionals<TType>, TContext, TDefault, TFlags>;
  oneOf(
    enums: ReadonlyArray<TType | Reference>,
    message?: Message<{ values: any }>,
  ): this;

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
    msg?: Message,
  ): StringSchema<TType | null, TContext, TDefault, TFlags>;
  nonNullable(
    msg?: Message
  ): StringSchema<NotNull<TType>, TContext, TDefault, TFlags>;

  strip(
    enabled: false,
  ): StringSchema<TType, TContext, TDefault, UnsetFlag<TFlags, 's'>>;
  strip(
    enabled?: true,
  ): StringSchema<TType, TContext, TDefault, SetFlag<TFlags, 's'>>;
}
