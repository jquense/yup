import has from 'lodash/has';
import isSchema from './util/isSchema';

function callOrConcat(schema) {
  if (typeof schema === 'function') return schema;
  if (!schema) return base => base;
  return (base, options) => base.concat(schema.resolve(options));
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
        let options = values.pop();
        let schema = values.pop();
        let option = isFn(...values) ? then : otherwise;

        return option(schema, options);
      };
    }
  }

  resolve(ctx, options) {
    let values = this.refs.map(ref => ref.getValue(options));

    let schema = this.fn.apply(ctx, values.concat(ctx, options));

    if (schema === undefined) return ctx;

    if (!isSchema(schema))
      throw new TypeError('conditions must return a schema object');

    return schema.resolve(options);
  }
}

export default Conditional;
