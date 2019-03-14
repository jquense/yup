import has from 'lodash/has';
import isSchema from './util/isSchema';

function wrapCusomFn(fn) {
  return function(...args) {
    args.pop();
    return fn.apply(this, args);
  };
}

function makeFn(options) {
  if (typeof options === 'function') return wrapCusomFn(options);

  if (!has(options, 'is'))
    throw new TypeError('`is:` is required for `when()` conditions');

  if (!options.then && !options.otherwise)
    throw new TypeError(
      'either `then:` or `otherwise:` is required for `when()` conditions',
    );

  let { is, then, otherwise } = options;

  let check;
  if (typeof is === 'function') {
    check = is;
  } else {
    check = (...values) => values.every(value => value === is);
  }

  let fn = function(...args) {
    let options = args.pop();
    let schema = args.pop();
    let branch = check(...args) ? then : otherwise;

    if (!branch) return undefined;
    if (typeof branch === 'function') return branch(schema);
    return schema.concat(branch.resolve(options));
  };

  return fn;
}

class Condition {
  constructor(refs, options) {
    this.refs = refs;
    this.fn = makeFn(options);
  }

  resolve(base, options) {
    let values = this.refs.map(ref => ref.getValue(options));

    let schema = this.fn.apply(base, values.concat(base, options));

    if (schema === undefined || schema === base) return base;

    if (!isSchema(schema))
      throw new TypeError('conditions must return a schema object');

    return schema.resolve(options);
  }
}

export default Condition;
