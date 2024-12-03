import printValue from './util/printValue';
import { Message } from './types';
import ValidationError from './ValidationError';

export interface MixedLocale {
  default?: Message;
  required?: Message;
  oneOf?: Message<{ values: any }>;
  notOneOf?: Message<{ values: any }>;
  notNull?: Message;
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
  datetime?: Message;
  datetime_offset?: Message;
  datetime_precision?: Message<{ precision: number }>;
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
  noUnknown?: Message<{ unknown: string[] }>;
  exact?: Message<{ properties: string[] }>;
}

export interface ArrayLocale {
  length?: Message<{ length: number }>;
  min?: Message<{ min: number }>;
  max?: Message<{ max: number }>;
}

export interface TupleLocale {
  notType?: Message;
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
  tuple?: TupleLocale;
}

export let mixed: Required<MixedLocale> = {
  default: '${path} is invalid',
  required: '${path} is a required field',
  defined: '${path} must be defined',
  notNull: '${path} cannot be null',
  oneOf: '${path} must be one of the following values: ${values}',
  notOneOf: '${path} must not be one of the following values: ${values}',
  notType: ({ path, type, value, originalValue }) => {
    const castMsg =
      originalValue != null && originalValue !== value
        ? ` (cast from the value \`${printValue(originalValue, true)}\`).`
        : '.';

    return type !== 'mixed'
      ? `${path} must be a \`${type}\` type, ` +
          `but the final value was: \`${printValue(value, true)}\`` +
          castMsg
      : `${path} must match the configured type. ` +
          `The validated value was: \`${printValue(value, true)}\`` +
          castMsg;
  },
};

export let string: Required<StringLocale> = {
  length: '${path} must be exactly ${length} characters',
  min: '${path} must be at least ${min} characters',
  max: '${path} must be at most ${max} characters',
  matches: '${path} must match the following: "${regex}"',
  email: '${path} must be a valid email',
  url: '${path} must be a valid URL',
  uuid: '${path} must be a valid UUID',
  datetime: '${path} must be a valid ISO date-time',
  datetime_precision:
    '${path} must be a valid ISO date-time with a sub-second precision of exactly ${precision} digits',
  datetime_offset:
    '${path} must be a valid ISO date-time with UTC "Z" timezone',
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
  exact: '${path} object contains unknown properties: ${properties}',
};

export let array: Required<ArrayLocale> = {
  min: '${path} field must have at least ${min} items',
  max: '${path} field must have less than or equal to ${max} items',
  length: '${path} must have ${length} items',
};

export let tuple: Required<TupleLocale> = {
  notType: (params) => {
    const { path, value, spec } = params;
    const typeLen = spec.types.length;
    if (Array.isArray(value)) {
      if (value.length < typeLen)
        return `${path} tuple value has too few items, expected a length of ${typeLen} but got ${
          value.length
        } for value: \`${printValue(value, true)}\``;
      if (value.length > typeLen)
        return `${path} tuple value has too many items, expected a length of ${typeLen} but got ${
          value.length
        } for value: \`${printValue(value, true)}\``;
    }

    return ValidationError.formatError(mixed.notType, params);
  },
};

export default Object.assign(Object.create(null), {
  mixed,
  string,
  number,
  date,
  object,
  array,
  boolean,
  tuple,
}) as LocaleObject;
