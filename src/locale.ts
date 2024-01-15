import printValue from './util/printValue';
import { Message } from './types';
import ValidationError from './ValidationError';
import en from './locales/en';

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

export default en;
