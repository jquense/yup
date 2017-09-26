function findIndex(arr, err) {
  let idx = Infinity;
  arr.some((key, ii) => {
    if (err.path.indexOf(key) !== -1) {
      idx = ii;
      return true;
    }
    return false;
  });

  return idx;
}

export default function sortByKeyOrder(fields) {
  const keys = Object.keys(fields);
  return (a, b) => findIndex(keys, a) - findIndex(keys, b);
}
