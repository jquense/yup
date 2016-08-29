
function findIndex(arr, err) {
  let idx = Infinity;
  arr.some((key, ii) => {
    if (err.path.indexOf(key) !== -1) {
      idx = ii
      return true
    }
  });

  return idx
}

export default function sortByKeyOrder(fields) {
  let keys = Object.keys(fields);
  return (a, b) => {
    return findIndex(keys, a) - findIndex(keys, b)
  }
}
