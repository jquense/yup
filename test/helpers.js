import printValue from '../src/util/printValue';

export let castAndShouldFail = (schema, value) => {
  expect(() => schema.cast(value)).toThrowError(TypeError);
};

export let castAll = (inst, { invalid = [], valid = [] }) => {
  valid.forEach(([value, result, schema = inst]) => {
    it(`should cast ${printValue(value)} to ${printValue(result)}`, () => {
      expect(schema.cast(value)).toBe(result);
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
        await expect(schema.isValid(value)).resolves.toEqual(isValid);
      });
    });
  }
};

export function validationErrorWithMessages(...errors) {
  return expect.objectContaining({
    errors,
  });
}

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
