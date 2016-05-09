"use strict";

function findIndex(arr, err) {
  var idx = Infinity;
  arr.some(function (key, ii) {
    if (err.path.indexOf(key) !== -1) {
      idx = ii;
      return true;
    }
  });

  return idx;
}

module.exports = function sortByFields(schema) {
  var keys = Object.keys(schema.fields);
  return function (a, b) {
    return findIndex(keys, a) - findIndex(keys, b);
  };
};