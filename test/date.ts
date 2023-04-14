import { ref, date } from '../src';
import * as TestHelpers from './helpers';

function isInvalidDate(date: any): date is Date {
  return date instanceof Date && isNaN(date.getTime());
}

describe('Date types', () => {
  it('should CAST correctly', () => {
    let inst = date();

    expect(inst.cast(new Date())).toBeInstanceOf(Date);
    expect(inst.cast('jan 15 2014')).toEqual(new Date(2014, 0, 15));
    expect(inst.cast('2014-09-23T19:25:25Z')).toEqual(new Date(1411500325000));
    // Leading-zero milliseconds
    expect(inst.cast('2016-08-10T11:32:19.012Z')).toEqual(
      new Date(1470828739012),
    );
    // Microsecond precision
    expect(inst.cast('2016-08-10T11:32:19.2125Z')).toEqual(
      new Date(1470828739212),
    );

    expect(inst.cast(null, { assert: false })).toEqual(null);
  });

  it('should return invalid date for failed non-null casts', function () {
    let inst = date();

    expect(inst.cast(null, { assert: false })).toEqual(null);
    expect(inst.cast(undefined, { assert: false })).toEqual(undefined);

    expect(isInvalidDate(inst.cast('', { assert: false }))).toBe(true);
    expect(isInvalidDate(inst.cast({}, { assert: false }))).toBe(true);
  });

  it('should type check', () => {
    let inst = date();

    expect(inst.isType(new Date())).toBe(true);
    expect(inst.isType(false)).toBe(false);
    expect(inst.isType(null)).toBe(false);
    expect(inst.isType(NaN)).toBe(false);
    expect(inst.nullable().isType(new Date())).toBe(true);
  });

  it('should VALIDATE correctly', () => {
    let inst = date().max(new Date(2014, 5, 15));

    return Promise.all([
      expect(date().isValid(null)).resolves.toBe(false),
      expect(date().nullable().isValid(null)).resolves.toBe(true),

      expect(inst.isValid(new Date(2014, 0, 15))).resolves.toBe(true),
      expect(inst.isValid(new Date(2014, 7, 15))).resolves.toBe(false),
      expect(inst.isValid('5')).resolves.toBe(true),

      expect(inst.required().validate(undefined)).rejects.toEqual(
        expect.objectContaining({
          errors: ['this is a required field'],
        }),
      ),

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
          expect.stringContaining('must be a `date` type'),
        ),
      ),
    ]);
  });

  it('should check MIN correctly', () => {
    let min = new Date(2014, 3, 15),
      invalid = new Date(2014, 1, 15),
      valid = new Date(2014, 5, 15);
    expect(function () {
      date().max('hello');
    }).toThrowError(TypeError);
    expect(function () {
      date().max(ref('$foo'));
    }).not.toThrowError();

    return Promise.all([
      expect(date().min(min).isValid(valid)).resolves.toBe(true),
      expect(date().min(min).isValid(invalid)).resolves.toBe(false),
      expect(date().min(min).isValid(null)).resolves.toBe(false),

      expect(
        date()
          .min(ref('$foo'))
          .isValid(valid, { context: { foo: min } }),
      ).resolves.toBe(true),
      expect(
        date()
          .min(ref('$foo'))
          .isValid(invalid, { context: { foo: min } }),
      ).resolves.toBe(false),
    ]);
  });

  it('should check MAX correctly', () => {
    let max = new Date(2014, 7, 15),
      invalid = new Date(2014, 9, 15),
      valid = new Date(2014, 5, 15);
    expect(function () {
      date().max('hello');
    }).toThrowError(TypeError);
    expect(function () {
      date().max(ref('$foo'));
    }).not.toThrowError();

    return Promise.all([
      expect(date().max(max).isValid(valid)).resolves.toBe(true),
      expect(date().max(max).isValid(invalid)).resolves.toBe(false),
      expect(date().max(max).nullable().isValid(null)).resolves.toBe(true),

      expect(
        date()
          .max(ref('$foo'))
          .isValid(valid, { context: { foo: max } }),
      ).resolves.toBe(true),
      expect(
        date()
          .max(ref('$foo'))
          .isValid(invalid, { context: { foo: max } }),
      ).resolves.toBe(false),
    ]);
  });
});
