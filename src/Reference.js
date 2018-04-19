import { getter } from 'property-expr';
import { isRelativePath, getRelativePath } from './util/makePath';

let validateType = d => {
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
    validateType(key);
    let prefix = options.contextPrefix || '$';

    this.key = key.trim();
    this.prefix = prefix;
    this.isContext = this.key.indexOf(prefix) === 0;
    this.isRelativePath = isRelativePath(this.key);
    this.path = this.isContext ? this.key.slice(this.prefix.length) : this.key;
    if (!this.isRelativePath) {
      this._get = getter(this.path, true);
    }
    this.map = mapFn || (value => value);
  }
  resolve() {
    return this;
  }

  cast(value, options) {
    return this.getValue(options);
  }

  getValue(options) {
    const { context, parent, path, value = {} } = options;
    let refValue;
    if (this.isRelativePath) {
      this.path = getRelativePath(path, this.key);
      this._get = getter(this.path, true);
      refValue = this._get(value);
    } else {
      refValue = this._get(this.isContext ? context : parent || value);
    }
    return this.map(refValue);
  }
}

Reference.prototype.__isYupRef = true;
