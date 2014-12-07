'use strict';
var mixed = require('./dist/mixed')
  //, dynamic = require('./dist/dynamic');

module.exports = {
  mixed:   mixed,
  string:  require('./dist/string'),
  number:  require('./dist/number'),
  boolean: require('./dist/boolean'),
  date:    require('./dist/date'),
  object:  require('./dist/object'),
  array:   require('./dist/array')
}



/*

schema.validate(val, opts)
	.then(function(result){
		result.isValid
		result.errors
	})

*/