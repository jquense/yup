import mixed from './mixed';
import bool from './boolean';
import Ref from './Reference';
import Lazy from './Lazy';
import isSchema from './util/isSchema';

export default {
  mixed:   mixed,
  string:  require('./string'),
  number:  require('./number'),
  boolean: bool,
  bool:    bool,
  date:    require('./date'),
  object:  require('./object'),
  array:   require('./array'),

  reach: require('./util/reach'),

  ValidationError: require('./ValidationError'),
  ref: (key, options) => new Ref(key, options),
  lazy: (fn) => new Lazy(fn),

  isSchema,

  addMethod(schemaType, name, fn) {
    if ( !schemaType || !isSchema(schemaType.prototype))
      throw new TypeError('You must provide a yup schema constructor function')

    if ( typeof name !== 'string') throw new TypeError('A Method name must be provided')
    if ( typeof fn !== 'function') throw new TypeError('Method function must be provided')

    schemaType.prototype[name] = fn
  }
}
