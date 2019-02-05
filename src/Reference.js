import { getter } from 'property-expr';

const prefixes = {
  context: '$',
  value: '.',
};

export default class Reference {
  constructor(key, options = {}) {
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

  getValue(options) {
    let result = this.isContext
      ? options.context
      : this.isValue
        ? options.value
        : options.parent;

    if (this.getter) result = this.getter(result || {});

    if (this.map) result = this.map(result);

    return result;
  }

  cast(value, options) {
    return this.getValue({ ...options, value });
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

  static isRef(value) {
    return value && value.__isYupRef;
  }
}

Reference.prototype.__isYupRef = true;
