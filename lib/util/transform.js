var has = require("./has");

module.exports = function transform(obj, cb, seed) {
  cb = cb.bind(null, seed = seed || (Array.isArray(obj) ? [] : {}));

  if (Array.isArray(obj)) obj.forEach(cb);else for (var key in obj) if (has(obj, key)) cb(obj[key], key, obj);

  return seed;
};