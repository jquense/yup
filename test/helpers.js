import isArray from 'lodash/isArray';

export const castAndShouldFail = (schema, value) => {
  (() => schema.cast(value))
    .should.throw(
      TypeError,
      /The value of (.+) could not be cast to a value that satisfies the schema type/gi,
    );
};

export const castAll = (inst, { invalid = [], valid = [] }) => {
  valid.forEach(([value, result, schema = inst]) => {
    it(`should cast ${JSON.stringify(value)} to ${JSON.stringify(result)}`, () => {
      expect(
        schema.cast(value),
      )
        .to.equal(result);
    });
  });

  invalid.forEach((value) => {
    it(`should not cast ${JSON.stringify(value)}`, () => {
      castAndShouldFail(inst, value);
    });
  });
};

export const validateAll = (inst, { valid = [], invalid = [] }) => {
  function runValidations(arr, isValid) {
    arr.forEach((config) => {
      let value = config;
      let schema = inst;

      if (isArray(config)) {
        [value, schema] = config;
      }

      it(`${JSON.stringify(value)} should be ${isValid ? 'valid' : 'invalid'}`,
        () => schema.isValid(value).should.become(isValid),
      );
    });
  }

  runValidations(valid, true);
  runValidations(invalid, false);
};
