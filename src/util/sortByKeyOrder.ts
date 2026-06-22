import ValidationError from '../ValidationError';

function findIndex(arr: readonly string[], err: ValidationError) {
  let idx = Infinity;
  arr.some((key, ii) => {
    const path = err.path;
    // Match the key as a whole path segment rather than a substring, otherwise
    // a key that is a prefix of another (e.g. `foo` vs `fooBar`) matches the
    // wrong field and the errors sort incorrectly. See #2252.
    if (
      path != null &&
      (path === key ||
        path.startsWith(`${key}.`) ||
        path.startsWith(`${key}[`))
    ) {
      idx = ii;
      return true;
    }
  });
  return idx;
}

export default function sortByKeyOrder(keys: readonly string[]) {
  return (a: ValidationError, b: ValidationError) => {
    return findIndex(keys, a) - findIndex(keys, b);
  };
}
