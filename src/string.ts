import MixedSchema from './mixed';
import { string as locale } from './locale';
import isAbsent from './util/isAbsent';
import Reference from './Reference';
import { Message, Maybe } from './types';
import { SetNullability, SetPresence, TypeDef } from './util/types';

// eslint-disable-next-line
let rEmail = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
// eslint-disable-next-line
let rUrl = /^((https?|ftp):)?\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;
// eslint-disable-next-line
let rUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let isTrimmed = (value: Maybe<string>) =>
  isAbsent(value) || value === value.trim();

export type MatchOptions = {
  excludeEmptyString?: boolean;
  message: Message<{ regex: RegExp }>;
  name?: string;
};

export function create() {
  return new StringSchema();
}

export default class StringSchema<
  TType extends string = string,
  TDef extends TypeDef = 'optional' | 'nonnullable',
  TDefault extends Maybe<TType> = undefined
> extends MixedSchema<TType, TDef, TDefault> {
  _tsType!: string | undefined;
  _tsValidate!: string | undefined;

  constructor() {
    super({ type: 'string' });

    this.withMutation(() => {
      this.transform(function (value) {
        if (this.isType(value)) return value;
        return value != null && value.toString ? value.toString() : value;
      });
    });
  }

  protected _typeCheck(value: any): value is string {
    if (value instanceof String) value = value.valueOf();

    return typeof value === 'string';
  }

  protected _isPresent(value: any) {
    return super._isPresent(value) && value.length > 0;
  }

  length(
    length: number | Reference,
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

  min(min: number | Reference, message: Message<{ min: number }> = locale.min) {
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

  max(max: number | Reference, message: Message<{ max: number }> = locale.max) {
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

  matches(regex: RegExp, options: MatchOptions | MatchOptions['message']) {
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
  ensure() {
    return this.default('').transform((val) => (val === null ? '' : val));
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

// @ts-ignore
export default interface StringSchema<
  TType extends string,
  TDef extends TypeDef,
  TDefault extends Maybe<TType>
> extends MixedSchema<TType, TDef> {
  default(): TDefault;
  default<TNextDefault extends Maybe<TType>>(
    def: TNextDefault | (() => TNextDefault),
  ): StringSchema<TType, TDef, TNextDefault>;

  required(): StringSchema<TType, SetPresence<TDef, 'required'>, TDefault>;
  notRequired(): StringSchema<TType, SetPresence<TDef, 'optional'>, TDefault>;

  nullable(
    isNullable?: true,
  ): StringSchema<TType, SetNullability<TDef, 'nullable'>, TDefault>;
  nullable(
    isNullable: false,
  ): StringSchema<TType, SetNullability<TDef, 'nonnullable'>, TDefault>;
}
