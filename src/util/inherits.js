/* eslint-disable no-param-reassign */
export default function inherits(ctor, superCtor, spec) {
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true,
    },
  });

  Object.assign(ctor.prototype, spec);
}
