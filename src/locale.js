/* eslint-disable no-template-curly-in-string */
import printValue from './util/printValue';
import { getLocale } from './customLocale';

const customLocale = getLocale();

export const mixed = {
  default: '${path} is invalid',
  required: '${path} is a required field',
  oneOf: '${path} must be one of the following values: ${values}',
  notOneOf: '${path} must not be one of the following values: ${values}',
  notType: ({ path, type, value, originalValue }) => {
    const isCast = originalValue != null && originalValue !== value;
    let msg = `${`${path} must be a \`${type}\` type, ` +
      `but the final value was: \`${printValue(value, true)}\``}${isCast ?
      ` (cast from the value \`${printValue(originalValue, true)}\`).` : '.'}`;

    if (value === null) {
      msg += '\n If "null" is intended as an empty value be sure to mark the schema as `.nullable()`';
    }

    return msg;
  },
  ...customLocale.mixed,
};

export const string = {
  length: '${path} must be exactly ${length} characters',
  min: '${path} must be at least ${min} characters',
  max: '${path} must be at most ${max} characters',
  matches: '${path} must match the following: "${regex}"',
  email: '${path} must be a valid email',
  url: '${path} must be a valid URL',
  trim: '${path} must be a trimmed string',
  lowercase: '${path} must be a lowercase string',
  uppercase: '${path} must be a upper case string',
  ...customLocale.string,
};

export const number = {
  min: '${path} must be greater than or equal to ${min}',
  max: '${path} must be less than or equal to ${max}',
  positive: '${path} must be a positive number',
  negative: '${path} must be a negative number',
  integer: '${path} must be an integer',
  ...customLocale.number,
};

export const date = {
  min: '${path} field must be later than ${min}',
  max: '${path} field must be at earlier than ${max}',
  ...customLocale.date,
};

export const boolean = {
  ...customLocale.boolean,
};

export const object = {
  noUnknown: '${path} field cannot have keys not specified in the object shape',
  ...customLocale.object,
};

export const array = {
  min: '${path} field must have at least ${min} items',
  max: '${path} field must have less than ${max} items',
  ...customLocale.array,
};

export default {
  mixed,
  string,
  number,
  date,
  object,
  array,
  boolean,
};
