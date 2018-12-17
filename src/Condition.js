import has from 'lodash.has';
import isSchema from './util/isSchema';

function callOrConcat(schema) {
  if (typeof schema === 'function') return schema;

  return base => base.concat(schema);
}

class Conditional {
  constructor(refs, options) {
    let { is, then, otherwise } = options;

    this.refs = [].concat(refs);

    then = callOrConcat(then);
    otherwise = callOrConcat(otherwise);

    if (typeof options === 'function') this.fn = options;
    else {
      if (!has(options, 'is'))
        throw new TypeError('`is:` is required for `when()` conditions');

      if (!options.then && !options.otherwise)
        throw new TypeError(
          'either `then:` or `otherwise:` is required for `when()` conditions',
        );

      let isFn =
        typeof is === 'function'
          ? is
          : (...values) => values.every(value => value === is);

      this.fn = function(...values) {
        let currentSchema = values.pop();
        let option = isFn(...values) ? then : otherwise;

        return option(currentSchema);
      };
    }
  }

  getValue(parent, context) {
    let values = this.refs.map(r => r.getValue(parent, context));

    return values;
  }

  resolve(ctx, values) {
    let schema = this.fn.apply(ctx, values.concat(ctx));

    if (schema !== undefined && !isSchema(schema))
      throw new TypeError('conditions must return a schema object');

    return schema || ctx;
  }
}

export default Conditional;
