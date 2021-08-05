import type { SchemaRefDescription } from '../schema';
import Reference from '../Reference';

export default class ReferenceSet {
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
    Reference.isRef(value)
      ? this.refs.set(value.key, value)
      : this.list.add(value);
  }
  delete(value: unknown) {
    Reference.isRef(value)
      ? this.refs.delete(value.key)
      : this.list.delete(value);
  }
  has(value: unknown, resolve: (v: unknown) => unknown) {
    if (this.list.has(value)) return true;

    let item,
      values = this.refs.values();
    while (((item = values.next()), !item.done)) {
      const resolved = resolve(item.value);
      if((Array.isArray(resolved) && resolved.some(r => r === value)) || resolved === value) return true;
    }
      

    return false;
  }

  clone() {
    const next = new ReferenceSet();
    next.list = new Set(this.list);
    next.refs = new Map(this.refs);
    return next;
  }

  merge(newItems: ReferenceSet, removeItems: ReferenceSet) {
    const next = this.clone();
    newItems.list.forEach((value) => next.add(value));
    newItems.refs.forEach((value) => next.add(value));
    removeItems.list.forEach((value) => next.delete(value));
    removeItems.refs.forEach((value) => next.delete(value));
    return next;
  }
}
