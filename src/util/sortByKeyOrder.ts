import ValidationError from '../ValidationError';

function findIndex(arr: readonly string[], err: ValidationError) {
  let idx = Infinity;
  arr.some((key, ii) => {
    if (err.path?.includes(key)) {
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
