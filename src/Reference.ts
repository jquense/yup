import { getter } from 'property-expr';

const prefixes = {
  context: '$',
  value: '.',
};

export type ReferenceOptions = {
  map?: (value: unknown) => unknown;
};

export function create(key: string, options: ReferenceOptions) {
  return new Reference(key, options);
}

export default class Reference {
  readonly key: string;
  readonly isContext: boolean;
  readonly isValue: boolean;
  readonly isSibling: boolean;
  readonly path: any;

  readonly getter: (data: unknown) => unknown;
  readonly map?: (value: unknown) => unknown;

  readonly __isYupRef!: boolean;

  constructor(key: string, options: ReferenceOptions = {}) {
    if (typeof key !== 'string')
      throw new TypeError('ref must be a string, got: ' + key);

    this.key = key.trim();

    if (key === '') throw new TypeError('ref must be a non-empty string');

    this.isContext = this.key[0] === prefixes.context;
    this.isValue = this.key[0] === prefixes.value;
    this.isSibling = !this.isContext && !this.isValue;

    let prefix = this.isContext
      ? prefixes.context
      : this.isValue
      ? prefixes.value
      : '';

    this.path = this.key.slice(prefix.length);
    this.getter = this.path && getter(this.path, true);
    this.map = options.map;
  }

  getValue(value: any, parent?: {}, context?: {}) {
    let result = this.isContext ? context : this.isValue ? value : parent;

    if (this.getter) result = this.getter(result || {});

    if (this.map) result = this.map(result);

    return result;
  }

  /**
   *
   * @param {*} value
   * @param {Object} options
   * @param {Object=} options.context
   * @param {Object=} options.parent
   */
  cast(value: any, options?: { parent?: {}; context?: {} }) {
    return this.getValue(value, options?.parent, options?.context);
  }

  resolve() {
    return this;
  }

  describe() {
    return {
      type: 'ref',
      key: this.key,
    };
  }

  toString() {
    return `Ref(${this.key})`;
  }

  static isRef(value: any): value is Reference {
    return value && value.__isYupRef;
  }
}

// @ts-ignore
Reference.prototype.__isYupRef = true;
