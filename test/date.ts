import { describe, it, expect } from 'vitest';
import { ref, date } from '../src';
import * as TestHelpers from './helpers';

function isInvalidDate(date: any): date is Date {
  return date instanceof Date && isNaN(date.getTime());
}

describe('Date types', () => {
  it.each([
    ['-271821-04-19T23:00:00-02:00', '-271821-04-20T01:00:00.000Z'],
    ['-271821-04-19T23:00:00-01:00', '-271821-04-20T00:00:00.000Z'],
    ['+275760-09-13T01:00:00+02:00', '+275760-09-12T23:00:00.000Z'],
    ['+275760-09-13T01:00:00+01:00', '+275760-09-13T00:00:00.000Z'],
  ])(
    'should apply offsets before checking the Date range: %s',
    (input, expected) => {
      expect(date().cast(input).toISOString()).toBe(expected);
    },
  );

  it.each([
    '-271821-04-19T23:59:59.999Z',
    '+275760-09-13T00:00:00.001Z',
    '-271821-04-20T00:00:00+00:01',
    '+275760-09-13T00:00:00-00:01',
  ])('should reject instants outside the Date range: %s', (input) => {
    expect(isInvalidDate(date().cast(input, { assert: false }))).toBe(true);
  });

  it.each([
    [-271821, 3, 20, 12],
    [275760, 8, 13, 0],
  ])(
    'should preserve local Date boundary behavior for year %s',
    (year, month, day, hour) => {
      const input = `${year < 0 ? '-' : '+'}${Math.abs(year)}-${String(
        month + 1,
      ).padStart(2, '0')}-${day}T${String(hour).padStart(2, '0')}:00:00`;
      expect(date().cast(input, { assert: false }).valueOf()).toBe(
        new Date(year, month, day, hour).valueOf(),
      );
    },
  );

  it.each(['0000', '0001', '0099'])(
    'should preserve the ISO year %s in local dates',
    (year) => {
      const value = date().cast(`${year}-02-28T12:30:00`);
      expect(value.getFullYear()).toBe(Number(year));
      expect(value.getMonth()).toBe(1);
      expect(value.getDate()).toBe(28);
      expect(value.getHours()).toBe(12);
      expect(value.getMinutes()).toBe(30);
    },
  );

  it.each([
    ['0000-02-29T12:30:00Z', '0000-02-29T12:30:00.000Z'],
    ['0099-01-01T00:00:00Z', '0099-01-01T00:00:00.000Z'],
    ['0000-01-01T00:00:00+01:00', '-000001-12-31T23:00:00.000Z'],
    ['0099-12-31T23:00:00-02:00', '0100-01-01T01:00:00.000Z'],
  ])('should cast early ISO dates with offsets: %s', (input, expected) => {
    expect(date().cast(input).toISOString()).toBe(expected);
  });

  it('should reject first-century dates below a minimum', async () => {
    expect(await date().min('1900-01-01').isValid('0099-01-01')).toBe(false);
  });

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
