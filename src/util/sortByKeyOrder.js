function findIndex(arr, err) {
  let idx = Infinity;
  arr.some((key, ii) => {
    if (new RegExp(`^${err.path}$`).test(key)) {
      idx = ii;
      return true;
    }
  });

  return idx;
}

export default function sortByKeyOrder(keys) {
  return (a, b) => {
    return findIndex(keys, a) - findIndex(keys, b);
  };
}
