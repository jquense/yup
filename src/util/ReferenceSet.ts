import type { SchemaRefDescription } from '../schema';
import Reference from '../Reference';

export default class ReferenceSet extends Set<unknown | Reference> {
  describe() {
    const description = [] as Array<unknown | SchemaRefDescription>;

    for (const item of this.values()) {
      description.push(Reference.isRef(item) ? item.describe() : item);
    }
    return description;
  }

  resolveAll(resolve: (v: unknown | Reference) => unknown) {
    let result = [] as unknown[];
    for (const item of this.values()) {
      result.push(resolve(item));
    }
    return result;
  }

  clone() {
    return new ReferenceSet(this.values());
  }

  merge(newItems: ReferenceSet, removeItems: ReferenceSet) {
    const next = this.clone();

    newItems.forEach((value) => next.add(value));
    removeItems.forEach((value) => next.delete(value));
    return next;
  }
}
