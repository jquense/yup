// @ts-ignore
import cloneDeep from 'nanoclone';

import { mixed as locale, MixedLocale } from './locale';
import Condition, { ConditionOptions, ResolveOptions } from './Condition';
import runTests from './util/runTests';
import createValidation, {
  TestFunction,
  Test,
  TestConfig,
} from './util/createValidation';
import printValue from './util/printValue';
import Ref from './Reference';
import { getIn } from './util/reach';
import Reference from './Reference';
import toArray from './util/toArray';
import {
  ValidateOptions,
  TransformFunction,
  Message,
  Callback,
  InternalOptions,
  Maybe,
} from './types';
import Schema, {
  CastOptions,
  SchemaRefDescription,
  SchemaDescription,
} from './Schema';
import { ValidationError } from '.';
import type {
  Default,
  Defined,
  Nullability,
  Presence,
  ResolveInput,
  ResolveOutput,
  StrictNonNullable,
  Unset,
} from './util/types';
import BaseSchema from './Base';

const UNSET = 'unset' as const;

class RefSet {
  list: Set<unknown>;
  refs: Map<string, Reference>;

  constructor() {
    this.list = new Set();
    this.refs = new Map();
  }
  get size() {
    return this.list.size + this.refs.size;
  }
  describe() {
    const description = [] as Array<unknown | SchemaRefDescription>;

    for (const item of this.list) description.push(item);
    for (const [, ref] of this.refs) description.push(ref.describe());

    return description;
  }
  toArray() {
    return Array.from(this.list).concat(Array.from(this.refs.values()));
  }
  add(value: unknown) {
    Ref.isRef(value) ? this.refs.set(value.key, value) : this.list.add(value);
  }
  delete(value: unknown) {
    Ref.isRef(value) ? this.refs.delete(value.key) : this.list.delete(value);
  }
  has(value: unknown, resolve: (v: unknown) => unknown) {
    if (this.list.has(value)) return true;

    let item,
      values = this.refs.values();
    while (((item = values.next()), !item.done))
      if (resolve(item.value) === value) return true;

    return false;
  }

  clone() {
    const next = new RefSet();
    next.list = new Set(this.list);
    next.refs = new Map(this.refs);
    return next;
  }

  merge(newItems: RefSet, removeItems: RefSet) {
    const next = this.clone();
    newItems.list.forEach((value) => next.add(value));
    newItems.refs.forEach((value) => next.add(value));
    removeItems.list.forEach((value) => next.delete(value));
    removeItems.refs.forEach((value) => next.delete(value));
    return next;
  }
}

export type SchemaSpec<TDefault> = {
  nullability: Nullability;
  presence: Presence;
  default?: TDefault | (() => TDefault);
  hasDefault?: boolean;
  abortEarly?: boolean;
  strip?: boolean;
  strict?: boolean;
  recursive?: boolean;
  label?: string | undefined;
  meta?: any;
};

export type SchemaOptions<TDefault> = {
  type?: string;
  spec?: SchemaSpec<TDefault>;
};

export type AnyMixed = MixedSchema<any, any>;

export function create<TType = any>() {
  return new MixedSchema<TType>();
}

export default class MixedSchema<
  TType = any,
  TPresence extends Presence = Unset
> extends BaseSchema<TType, TType, TPresence> {}

export default interface MixedSchema<TType, TPresence extends Presence> {
  default<TNextDefault extends Maybe<TType>>(
    def: TNextDefault | (() => TNextDefault),
  ): TNextDefault extends undefined
    ? MixedSchema<TType | undefined, TPresence>
    : MixedSchema<Defined<TType>, TPresence>;

  defined(msg?: MixedLocale['defined']): MixedSchema<TType, 'defined'>;
  required(msg?: MixedLocale['required']): MixedSchema<TType, 'required'>;
  notRequired(): MixedSchema<TType, 'optional'>;

  nullable(isNullable?: true): MixedSchema<TType | null, TPresence>;
  nullable(isNullable: false): MixedSchema<StrictNonNullable<TType>, TPresence>;
}
