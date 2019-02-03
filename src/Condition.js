import has from 'lodash/has';
import isSchema from './util/isSchema';

function callOrConcat(schema) {
  if (typeof schema === 'function') return schema;

  return base => base.concat(schema);
}

function makeIsFn(refs, predicate) {
  return refs.length < 2 ? predicate : (...values) => values.every(predicate);
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

      let isFn;

      if (typeof is === 'function') {
        isFn = is;
      } else if (isSchema(is)) {
        isFn = makeIsFn(this.refs, value => is.isValidSync(value));
      } else {
        isFn = makeIsFn(this.refs, value => value === is);
      }

      this.fn = function(...values) {
        let currentSchema = values.pop();
        let option = isFn(...values) ? then : otherwise;

        return option(currentSchema);
      };
    }
  }

  resolve(ctx, options) {
    let values = this.refs.map(ref => ref.getValue(options));

    let schema = this.fn.apply(ctx, values.concat(ctx));

    if (schema !== undefined && !isSchema(schema))
      throw new TypeError('conditions must return a schema object');

    return schema || ctx;
  }
}

export default Conditional;
