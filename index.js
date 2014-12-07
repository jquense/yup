'use strict';
var mixed = require('./lib/mixed')
  //, dynamic = require('./lib/dynamic');

module.exports = {
  mixed:   mixed,
  string:  require('./lib/string'),
  number:  require('./lib/number'),
  boolean: require('./lib/boolean'),
  date:    require('./lib/date'),
  object:  require('./lib/object'),
  array:   require('./lib/array')
}



/*

schema.validate(val, opts)
	.then(function(result){
		result.isValid
		result.errors
	})

*/