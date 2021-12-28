import { bool } from '../src';
import * as TestHelpers from './helpers';

describe('Boolean types', () => {
  it('should CAST correctly', () => {
    let inst = bool();

    expect(inst.cast('true')).toBe(true);
    expect(inst.cast('True')).toBe(true);
    expect(inst.cast('false')).toBe(false);
    expect(inst.cast('False')).toBe(false);
    expect(inst.cast(1)).toBe(true);
    expect(inst.cast(0)).toBe(false);

    TestHelpers.castAndShouldFail(inst, 'foo');

    TestHelpers.castAndShouldFail(inst, 'bar1');
  });

  it('should handle DEFAULT', () => {
    let inst = bool();

    expect(inst.getDefault()).toBeUndefined();
    expect(inst.default(true).required().getDefault()).toBe(true);
  });

  it('should type check', () => {
    let inst = bool();

    expect(inst.isType(1)).toBe(false);
    expect(inst.isType(false)).toBe(true);
    expect(inst.isType('true')).toBe(false);
    expect(inst.isType(NaN)).toBe(false);
    expect(inst.isType(new Number('foooo'))).toBe(false);

    expect(inst.isType(34545)).toBe(false);
    expect(inst.isType(new Boolean(false))).toBe(true);

    expect(inst.isType(null)).toBe(false);

    expect(inst.nullable().isType(null)).toBe(true);
  });

  it('bool should VALIDATE correctly', () => {
    let inst = bool().required();

    return Promise.all([
      expect(bool().isValid('1')).resolves.toBe(true),
      expect(bool().strict().isValid(null)).resolves.toBe(false),
      expect(bool().nullable().isValid(null)).resolves.toBe(true),
      expect(inst.validate(undefined)).rejects.toEqual(
        expect.objectContaining({
          errors: ['this is a required field'],
        }),
      ),
    ]);
  });

  it('should check isTrue correctly', () => {
    return Promise.all([
      expect(bool().isTrue().isValid(true)).resolves.toBe(true),
      expect(bool().isTrue().isValid(false)).resolves.toBe(false),
    ]);
  });

  it('should check isFalse correctly', () => {
    return Promise.all([
      expect(bool().isFalse().isValid(false)).resolves.toBe(true),
      expect(bool().isFalse().isValid(true)).resolves.toBe(false),
    ]);
  });
});
