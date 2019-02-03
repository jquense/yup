import { getter } from 'property-expr';

let validateName = d => {
  if (typeof d !== 'string')
    throw new TypeError("ref's must be strings, got: " + d);
};

export default class Reference {
  static isRef(value) {
    return !!(value && (value.__isYupRef || value instanceof Reference));
  }

  toString() {
    return `Ref(${this.key})`;
  }

  constructor(key, mapFn, options = {}) {
    validateName(key);
    let prefix = options.contextPrefix || '$';

    this.key = key.trim();
    this.prefix = prefix;

    this.isContext = this.key.indexOf(prefix) === 0;
    this.isParent = this.key === '';
    this.isSelf = this.key === '.';
    this.isSibling = !this.isContext && !this.isParent && !this.isSelf;

    if (!this.isSelf) {
      this.path = this.isContext
        ? this.key.slice(this.prefix.length)
        : this.key;
      this._get = getter(this.path, true);
    }

    this.map = mapFn || (value => value);
  }
  resolve() {
    return this;
  }

  cast(value, { parent, context }) {
    return this.getValue(value, parent, context);
  }

  getValue(value, parent, context) {
    if (!this.isSelf) {
      value = this._get(this.isContext ? context : parent || context || {});
    }

    return this.map(value);
  }
}

Reference.prototype.__isYupRef = true;
