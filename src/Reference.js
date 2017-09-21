/* eslint-disable no-param-reassign */
import { getter } from 'property-expr';

const validateName = (d) => {
  if (typeof d !== 'string') { throw new TypeError(`ref's must be strings, got: ${d}`); }
};

export default class Reference {
  static isRef(value) {
    return !!(value && (value.__isYupRef || value instanceof Reference));
  }

  constructor(key, mapFn, options = {}) {
    validateName(key);
    const prefix = options.contextPrefix || '$';

    if (typeof key === 'function') {
      key = '.';
    }

    this.key = key.trim();
    this.prefix = prefix;
    this.isContext = this.key.indexOf(prefix) === 0;
    this.isSelf = this.key === '.';

    this.path = this.isContext ? this.key.slice(this.prefix.length) : this.key;
    this._get = getter(this.path, true);
    this.map = mapFn || (value => value);
  }
  resolve() {
    return this;
  }

  cast(value, { parent, context }) {
    return this.getValue(parent, context);
  }

  getValue(parent, context) {
    const isContext = this.isContext;
    const value = this._get(isContext ? context : (parent || context) || {});
    return this.map(value);
  }
}

Reference.prototype.__isYupRef = true;
