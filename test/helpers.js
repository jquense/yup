import printValue from '../src/util/printValue';

export let castAndShouldFail = (schema, value) => {
  (() => schema.cast(value)).should.throw(
    TypeError,
    /The value of (.+) could not be cast to a value that satisfies the schema type/gi,
  );
};

export let castAll = (inst, { invalid = [], valid = [] }) => {
  valid.forEach(([value, result, schema = inst]) => {
    it(`should cast ${printValue(value)} to ${printValue(result)}`, () => {
      expect(schema.cast(value)).to.equal(result);
    });
  });

  invalid.forEach((value) => {
    it(`should not cast ${printValue(value)}`, () => {
      castAndShouldFail(inst, value);
    });
  });
};

export let validateAll = (inst, { valid = [], invalid = [] }) => {
  describe('valid:', () => {
    runValidations(valid, true);
  });

  describe('invalid:', () => {
    runValidations(invalid, false);
  });

  function runValidations(arr, isValid) {
    arr.forEach((config) => {
      let message = '',
        value = config,
        schema = inst;

      if (Array.isArray(config)) [value, schema, message = ''] = config;

      it(`${printValue(value)}${message && `  (${message})`}`, async () => {
        await schema.isValid(value).should.become(isValid);
      });
    });
  }
};

export function ensureSync(fn) {
  let run = false;
  let resolve = (t) => {
    if (!run) return t;
    throw new Error('Did not execute synchronously');
  };
  let err = (t) => {
    if (!run) throw t;
    throw new Error('Did not execute synchronously');
  };

  let result = fn().then(resolve, err);

  run = true;
  return result;
}
