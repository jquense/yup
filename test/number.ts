import * as TestHelpers from './helpers';

import { number, NumberSchema } from '../src';

describe('Number types', function () {
  it('is extensible', () => {
    class MyNumber extends NumberSchema {
      foo() {
        return this;
      }
    }

    new MyNumber().foo().integer().required();
  });

  describe('casting', () => {
    let schema = number();

    TestHelpers.castAll(schema, {
      valid: [
        ['5', 5],
        [3, 3],
        //[new Number(5), 5],
        [' 5.656 ', 5.656],
      ],
      invalid: ['', false, true, new Date(), new Number('foo')],
    });

    it('should round', () => {
      // @ts-expect-error stricter type than accepted
      expect(schema.round('ceIl').cast(45.1111)).toBe(46);

      expect(schema.round().cast(45.444444)).toBe(45);

      expect(schema.nullable().integer().round().cast(null)).toBeNull();
      expect(function () {
        // @ts-expect-error testing incorrectness
        schema.round('fasf');
      }).toThrowError(TypeError);
    });

    it('should truncate', () => {
      expect(schema.truncate().cast(45.55)).toBe(45);
    });

    it('should return NaN for failed casts', () => {
      expect(number().cast('asfasf', { assert: false })).toEqual(NaN);

      expect(number().cast(new Date(), { assert: false })).toEqual(NaN);
      expect(number().cast(null, { assert: false })).toEqual(null);
    });
  });

  it('should handle DEFAULT', function () {
    let inst = number().default(0);

    expect(inst.getDefault()).toBe(0);
    expect(inst.default(5).required().getDefault()).toBe(5);
  });

  it('should type check', function () {
    let inst = number();

    expect(inst.isType(5)).toBe(true);
    expect(inst.isType(new Number(5))).toBe(true);
    expect(inst.isType(new Number('foo'))).toBe(false);
    expect(inst.isType(false)).toBe(false);
    expect(inst.isType(null)).toBe(false);
    expect(inst.isType(NaN)).toBe(false);
    expect(inst.nullable().isType(null)).toBe(true);
  });

  it('should VALIDATE correctly', function () {
    let inst = number().min(4);

    return Promise.all([
      expect(number().isValid(null)).resolves.toBe(false),
      expect(number().nullable().isValid(null)).resolves.toBe(true),
      expect(number().isValid(' ')).resolves.toBe(false),
      expect(number().isValid('12abc')).resolves.toBe(false),
      expect(number().isValid(0xff)).resolves.toBe(true),
      expect(number().isValid('0xff')).resolves.toBe(true),

      expect(inst.isValid(5)).resolves.toBe(true),
      expect(inst.isValid(2)).resolves.toBe(false),

      expect(inst.required().validate(undefined)).rejects.toEqual(
        TestHelpers.validationErrorWithMessages(
          expect.stringContaining('required'),
        ),
      ),
      expect(inst.validate(null)).rejects.toEqual(
        TestHelpers.validationErrorWithMessages(
          expect.stringContaining('cannot be null'),
        ),
      ),
      expect(inst.validate({})).rejects.toEqual(
        TestHelpers.validationErrorWithMessages(
          expect.stringContaining('must be a `number` type'),
        ),
      ),
    ]);
  });

  describe('min', () => {
    let schema = number().min(5);

    TestHelpers.validateAll(schema, {
      valid: [7, 35738787838, [null, schema.nullable()]],
      invalid: [2, null, [14, schema.min(10).min(15)]],
    });
  });

  describe('max', () => {
    let schema = number().max(5);

    TestHelpers.validateAll(schema, {
      valid: [4, -5222, [null, schema.nullable()]],
      invalid: [10, null, [16, schema.max(20).max(15)]],
    });
  });

  describe('lessThan', () => {
    let schema = number().lessThan(5);

    TestHelpers.validateAll(schema, {
      valid: [4, -10, [null, schema.nullable()]],
      invalid: [5, 7, null, [14, schema.lessThan(10).lessThan(14)]],
    });

    it('should return default message', async () => {
      await expect(schema.validate(6)).rejects.toEqual(
        TestHelpers.validationErrorWithMessages('this must be less than 5'),
      );
    });
  });

  describe('moreThan', () => {
    let schema = number().moreThan(5);

    TestHelpers.validateAll(schema, {
      valid: [6, 56445435, [null, schema.nullable()]],
      invalid: [5, -10, null, [64, schema.moreThan(52).moreThan(74)]],
    });

    it('should return default message', async () => {
      await expect(schema.validate(4)).rejects.toEqual(
        TestHelpers.validationErrorWithMessages(
          expect.stringContaining('this must be greater than 5'),
        ),
      );
    });
  });

  describe('integer', () => {
    let schema = number().integer();

    TestHelpers.validateAll(schema, {
      valid: [4, -5222, 3.12312e51],
      invalid: [10.53, 0.1 * 0.2, -34512535.626, new Date()],
    });

    it('should return default message', async () => {
      await expect(schema.validate(10.53)).rejects.toEqual(
        TestHelpers.validationErrorWithMessages('this must be an integer'),
      );
    });
  });

  it('should check POSITIVE correctly', function () {
    let v = number().positive();

    return Promise.all([
      expect(v.isValid(7)).resolves.toBe(true),

      expect(v.isValid(0)).resolves.toBe(false),

      expect(v.validate(0)).rejects.toEqual(
        TestHelpers.validationErrorWithMessages(
          'this must be a positive number',
        ),
      ),
    ]);
  });

  it('should check NEGATIVE correctly', function () {
    let v = number().negative();

    return Promise.all([
      expect(v.isValid(-4)).resolves.toBe(true),

      expect(v.isValid(0)).resolves.toBe(false),

      expect(v.validate(10)).rejects.toEqual(
        TestHelpers.validationErrorWithMessages(
          'this must be a negative number',
        ),
      ),
    ]);
  });
});
