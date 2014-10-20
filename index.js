'use strict';
var mixed = require('./lib/mixed')
  //, dynamic = require('./lib/dynamic');

//add after to avoid circular requires
// mixed.prototype.when = function(key, options){
//   var is   = options.is
//     , then = options.then ? this.concat(options.then) : this
//     , or   = options.or ? this.concat(options.or) : this;

//   return dynamic().when(key, { ref: key, is: is, then: then, or: or })
// }

module.exports = {
  mixed:   mixed,
  string:  require('./lib/string'),
  number:  require('./lib/number'),
  boolean: require('./lib/boolean'),
  date:    require('./lib/date'),
  object:  require('./lib/object'),
  array:   require('./lib/array')
}