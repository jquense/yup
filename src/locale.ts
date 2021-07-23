import printValue from './util/printValue';
import { Message } from './types';

export interface MixedLocale {
  default?: Message;
  required?: Message;
  oneOf?: Message<{ values: any }>;
  notOneOf?: Message<{ values: any }>;
  notType?: Message;
  defined?: Message;
}

export interface StringLocale {
  length?: Message<{ length: number }>;
  min?: Message<{ min: number }>;
  max?: Message<{ max: number }>;
  matches?: Message<{ regex: RegExp }>;
  email?: Message<{ regex: RegExp }>;
  url?: Message<{ regex: RegExp }>;
  uuid?: Message<{ regex: RegExp }>;
  trim?: Message;
  lowercase?: Message;
  uppercase?: Message;
}

export interface NumberLocale {
  min?: Message<{ min: number }>;
  max?: Message<{ max: number }>;
  lessThan?: Message<{ less: number }>;
  moreThan?: Message<{ more: number }>;
  positive?: Message<{ more: number }>;
  negative?: Message<{ less: number }>;
  integer?: Message;
}

export interface DateLocale {
  min?: Message<{ min: Date | string }>;
  max?: Message<{ max: Date | string }>;
}

export interface ObjectLocale {
  noUnknown?: Message;
}

export interface ArrayLocale {
  length?: Message<{ length: number }>;
  min?: Message<{ min: number }>;
  max?: Message<{ max: number }>;
}

export interface BooleanLocale {
  isValue?: Message;
}

export interface LocaleObject {
  mixed?: MixedLocale;
  string?: StringLocale;
  number?: NumberLocale;
  date?: DateLocale;
  boolean?: BooleanLocale;
  object?: ObjectLocale;
  array?: ArrayLocale;
}

export let mixed: Required<MixedLocale> = {
  default: '${path} is invalid',
  required: '${path} is a required field',
  oneOf: '${path} must be one of the following values: ${values}',
  notOneOf: '${path} must not be one of the following values: ${values}',
  notType: ({ path, type, value, originalValue }) => {
    let isCast = originalValue != null && originalValue !== value;
    let msg =
      `${path} must be a \`${type}\` type, ` +
      `but the final value was: \`${printValue(value, true)}\`` +
      (isCast
        ? ` (cast from the value \`${printValue(originalValue, true)}\`).`
        : '.');

    if (value === null) {
      msg += `\n If "null" is intended as an empty value be sure to mark the schema as \`.nullable()\``;
    }

    return msg;
  },
  defined: '${path} must be defined',
};

export let string: Required<StringLocale> = {
  length: '${path} must be exactly ${length} characters',
  min: '${path} must be at least ${min} characters',
  max: '${path} must be at most ${max} characters',
  matches: '${path} must match the following: "${regex}"',
  email: '${path} must be a valid email',
  url: '${path} must be a valid URL',
  uuid: '${path} must be a valid UUID',
  trim: '${path} must be a trimmed string',
  lowercase: '${path} must be a lowercase string',
  uppercase: '${path} must be a upper case string',
};

export let number: Required<NumberLocale> = {
  min: '${path} must be greater than or equal to ${min}',
  max: '${path} must be less than or equal to ${max}',
  lessThan: '${path} must be less than ${less}',
  moreThan: '${path} must be greater than ${more}',
  positive: '${path} must be a positive number',
  negative: '${path} must be a negative number',
  integer: '${path} must be an integer',
};

export let date: Required<DateLocale> = {
  min: '${path} field must be later than ${min}',
  max: '${path} field must be at earlier than ${max}',
};

export let boolean: BooleanLocale = {
  isValue: '${path} field must be ${value}',
};

export let object: Required<ObjectLocale> = {
  noUnknown: '${path} field has unspecified keys: ${unknown}',
};

export let array: Required<ArrayLocale> = {
  min: '${path} field must have at least ${min} items',
  max: '${path} field must have less than or equal to ${max} items',
  length: '${path} must have ${length} items',
};

export default Object.assign(Object.create(null), {
  mixed,
  string,
  number,
  date,
  object,
  array,
  boolean,
});
