

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

module.exports = function sortByFields(schema) {
  let keys = Object.keys(schema.fields);
  return (a, b) => {
    return findIndex(keys, a) - findIndex(keys, b)
  }
}
