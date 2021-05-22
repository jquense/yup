import { MixedLocale, string as locale } from './locale';
import isAbsent from './util/isAbsent';
import type Reference from './Reference';
import type { Message, Maybe, AnyObject } from './types';
import type { Defined, If, Thunk } from './util/types';
import BaseSchema from './schema';

// eslint-disable-next-line
let rEmail = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
// eslint-disable-next-line
let rUrl = /^((https?|ftp):)?\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;
// eslint-disable-next-line
let rUUID = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;

let isTrimmed = (value: Maybe<string>) =>
  isAbsent(value) || value === value.trim();

export type MatchOptions = {
  excludeEmptyString?: boolean;
  message: Message<{ regex: RegExp }>;
  name?: string;
};

let objStringTag = {}.toString();

export function create() {
  return new StringSchema();
}

export default class StringSchema<
  TType extends Maybe<string> = string | undefined,
  TContext extends AnyObject = AnyObject,
  TOut extends TType = TType
> extends BaseSchema<TType, TContext, TOut> {
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
    message: Message<{ length: number }>,
  ) {
    return this.test({
      message: () => message || locale.length,
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
    message: Message<{ min: number }>,
  ) {
    return this.test({
      message: () => message || locale.min,
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
    message: Message<{ max: number }>,
  ) {
    return this.test({
      name: 'max',
      exclusive: true,
      message: () => message || locale.max,
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
      // TODO: make this a function
      message: message || locale.matches,
      params: { regex },
      test: (value: Maybe<string>) =>
        isAbsent(value) ||
        (value === '' && excludeEmptyString) ||
        value.search(regex) !== -1,
    });
  }

  email(message?:string) {
    return this.matches(rEmail, {
      name: 'email',
      message: () => message || locale.email,
      excludeEmptyString: true,
    });
  }

  url(message?:string) {
    return this.matches(rUrl, {
      name: 'url',
      message: () => message || locale.url,
      excludeEmptyString: true,
    });
  }

  uuid(message?:string) {
    return this.matches(rUUID, {
      name: 'uuid',
      message: () => message || locale.uuid,
      excludeEmptyString: false,
    });
  }

  //-- transforms --
  ensure(): StringSchema<NonNullable<TType>> {
    return this.default('' as Defined<TType>).transform((val) =>
      val === null ? '' : val,
    ) as any;
  }

  trim(message?:string) {
    return this.transform((val) => (val != null ? val.trim() : val)).test({
      message: () => message || locale.trim,
      name: 'trim',
      test: isTrimmed,
    });
  }

  lowercase(message?:string) {
    return this.transform((value) =>
      !isAbsent(value) ? value.toLowerCase() : value,
    ).test({
      message: () => message || locale.lowercase,
      name: 'string_case',
      exclusive: true,
      test: (value: Maybe<string>) =>
        isAbsent(value) || value === value.toLowerCase(),
    });
  }

  uppercase(message?:string) {
    return this.transform((value) =>
      !isAbsent(value) ? value.toUpperCase() : value,
    ).test({
      message: () => message || locale.uppercase,
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
export interface DefinedStringSchema<
  TType extends Maybe<string>,
  TContext extends AnyObject = AnyObject
> extends StringSchema<TType, TContext, Defined<TType>> {
  default<D extends Maybe<TType>>(
    def: Thunk<D>,
  ): If<
    D,
    DefinedStringSchema<TType | undefined, TContext>,
    DefinedStringSchema<Defined<TType>, TContext>
  >;

  defined(msg?: MixedLocale['defined']): this;
  required(
    msg?: MixedLocale['required'],
  ): RequiredStringSchema<TType, TContext>;
  optional(): StringSchema<TType, TContext>;
  notRequired(): StringSchema<TType, TContext>;
  nullable(isNullable?: true): RequiredStringSchema<TType | null, TContext>;
  nullable(
    isNullable: false,
  ): RequiredStringSchema<Exclude<TType, null>, TContext>;
}

export interface RequiredStringSchema<
  TType extends Maybe<string>,
  TContext extends AnyObject = AnyObject
> extends StringSchema<TType, TContext, NonNullable<TType>> {
  default<D extends Maybe<TType>>(
    def: Thunk<D>,
  ): If<
    D,
    RequiredStringSchema<TType | undefined, TContext>,
    RequiredStringSchema<Defined<TType>, TContext>
  >;

  defined(msg?: MixedLocale['defined']): DefinedStringSchema<TType, TContext>;
  required(
    msg?: MixedLocale['required'],
  ): RequiredStringSchema<TType, TContext>;
  optional(): StringSchema<TType, TContext>;
  notRequired(): StringSchema<TType, TContext>;
  nullable(isNullable?: true): RequiredStringSchema<TType | null, TContext>;
  nullable(
    isNullable: false,
  ): RequiredStringSchema<Exclude<TType, null>, TContext>;
}

export default interface StringSchema<
  TType extends Maybe<string> = string | undefined,
  TContext extends AnyObject = AnyObject,
  TOut extends TType = TType
> extends BaseSchema<TType, TContext, TOut> {
  concat<TOther extends StringSchema<any, any, any>>(schema: TOther): TOther;

  default<D extends Maybe<TType>>(
    def: Thunk<D>,
  ): If<
    D,
    StringSchema<TType | undefined, TContext>,
    StringSchema<Defined<TType>, TContext>
  >;

  defined(msg?: MixedLocale['defined']): DefinedStringSchema<TType, TContext>;
  required(
    msg?: MixedLocale['required'],
  ): RequiredStringSchema<TType, TContext>;
  optional(): StringSchema<TType, TContext>;
  notRequired(): StringSchema<TType, TContext>;

  nullable(isNullable?: true): StringSchema<TType | null, TContext>;
  nullable(isNullable: false): StringSchema<Exclude<TType, null>, TContext>;
  withContext<TNextContext extends TContext>(): StringSchema<
    Exclude<TType, null>,
    TNextContext
  >;
}
