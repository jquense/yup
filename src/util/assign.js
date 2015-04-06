var has = require('./has')

module.exports = function assign(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) if ( has(source, key)) 
      target[key] = source[key];
  }

  return target;
}