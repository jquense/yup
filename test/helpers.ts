import { ISchema } from '../src/types';
import printValue from '../src/util/printValue';

export let castAndShouldFail = (schema: ISchema<any>, value: any) => {
  expect(() => schema.cast(value)).toThrowError(TypeError);
};

type Options = {
  invalid?: any[];
  valid?: any[];
};
export let castAll = (
  inst: ISchema<any>,
  { invalid = [], valid = [] }: Options,
) => {
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

export let validateAll = (
  inst: ISchema<any>,
  { valid = [], invalid = [] }: Options,
) => {
  describe('valid:', () => {
    runValidations(valid, true);
  });

  describe('invalid:', () => {
    runValidations(invalid, false);
  });

  function runValidations(arr: any[], isValid: boolean) {
    arr.forEach((config) => {
      let message = '',
        value = config,
        schema = inst;

      if (Array.isArray(config)) [value, schema, message = ''] = config;

      it(`${printValue(value)}${message && `  (${message})`}`, async () => {
        await expect((schema as any).isValid(value)).resolves.toEqual(isValid);
      });
    });
  }
};

export function validationErrorWithMessages(...errors: any[]) {
  return expect.objectContaining({
    errors,
  });
}

export function ensureSync(fn: () => Promise<any>) {
  let run = false;
  let resolve = (t: any) => {
    if (!run) return t;
    throw new Error('Did not execute synchronously');
  };
  let err = (t: any) => {
    if (!run) throw t;
    throw new Error('Did not execute synchronously');
  };

  let result = fn().then(resolve, err);

  run = true;
  return result;
}
