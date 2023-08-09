/**
 * This file is a modified version of the test file from the following repository:
 * Date.parse with progressive enhancement for ISO 8601 <https://github.com/csnover/js-iso8601>
 * NON-CONFORMANT EDITION.
 * © 2011 Colin Snover <http://zetafleet.com>
 * Released under MIT license.
 */

import parseIsoDate from '../../src/util/isodate';

const sixHours = 6 * 60 * 60 * 1000;
const sixHoursThirty = sixHours + 30 * 60 * 1000;

describe('plain date (no time)', () => {
  test('Unix epoch', () => {
    const result = parseIsoDate('1970-01-01');
    const expected = Date.UTC(1970, 0, 1, 0, 0, 0, 0);
    expect(result).toBe(expected);
  });
  test('2001', () => {
    const result = parseIsoDate('2001');
    const expected = Date.UTC(2001, 0, 1, 0, 0, 0, 0);
    expect(result).toBe(expected);
  });
  test('2001-02', () => {
    const result = parseIsoDate('2001-02');
    const expected = Date.UTC(2001, 1, 1, 0, 0, 0, 0);
    expect(result).toBe(expected);
  });
  test('2001-02-03', () => {
    const result = parseIsoDate('2001-02-03');
    const expected = Date.UTC(2001, 1, 3, 0, 0, 0, 0);
    expect(result).toBe(expected);
  });
  test('-002001', () => {
    const result = parseIsoDate('-002001');
    const expected = Date.UTC(-2001, 0, 1, 0, 0, 0, 0);
    expect(result).toBe(expected);
  });
  test('-002001-02', () => {
    const result = parseIsoDate('-002001-02');
    const expected = Date.UTC(-2001, 1, 1, 0, 0, 0, 0);
    expect(result).toBe(expected);
  });
  test('-002001-02-03', () => {
    const result = parseIsoDate('-002001-02-03');
    const expected = Date.UTC(-2001, 1, 3, 0, 0, 0, 0);
    expect(result).toBe(expected);
  });
  test('+010000-02', () => {
    const result = parseIsoDate('+010000-02');
    const expected = Date.UTC(10000, 1, 1, 0, 0, 0, 0);
    expect(result).toBe(expected);
  });
  test('+010000-02-03', () => {
    const result = parseIsoDate('+010000-02-03');
    const expected = Date.UTC(10000, 1, 3, 0, 0, 0, 0);
    expect(result).toBe(expected);
  });
  test('-010000-02', () => {
    const result = parseIsoDate('-010000-02');
    const expected = Date.UTC(-10000, 1, 1, 0, 0, 0, 0);
    expect(result).toBe(expected);
  });
  test('-010000-02-03', () => {
    const result = parseIsoDate('-010000-02-03');
    const expected = Date.UTC(-10000, 1, 3, 0, 0, 0, 0);
    expect(result).toBe(expected);
  });

  test('invalid YYYY (non-digits)', () => {
    expect(parseIsoDate('asdf')).toBeNaN();
  });
  test('invalid YYYY-MM-DD (non-digits)', () => {
    expect(parseIsoDate('1970-as-df')).toBeNaN();
  });
  test('invalid YYYY-MM- (extra hyphen)', () => {
    expect(parseIsoDate('1970-01-')).toBeNaN();
  });
  test('invalid YYYY-MM-DD (missing hyphens)', () => {
    expect(parseIsoDate('19700101')).toBeNaN();
  });
  test('ambiguous YYYY-MM/YYYYYY (missing plus/minus or hyphen)', () => {
    expect(parseIsoDate('197001')).toBeNaN();
  });
});

describe('date-time', () => {
  test('2001-02-03T04:05', () => {
    const result = parseIsoDate('2001-02-03T04:05');
    const expected = Date.UTC(2001, 1, 3, 4, 5, 0, 0);
    expect(result).toBe(expected);
  });
  test('2001-02-03T04:05:06', () => {
    const result = parseIsoDate('2001-02-03T04:05:06');
    const expected = Date.UTC(2001, 1, 3, 4, 5, 6, 0);
    expect(result).toBe(expected);
  });
  test('2001-02-03T04:05:06.007', () => {
    const result = parseIsoDate('2001-02-03T04:05:06.007');
    const expected = Date.UTC(2001, 1, 3, 4, 5, 6, 7);
    expect(result).toBe(expected);
  });

  test('2001-02-03T04:05Z', () => {
    const result = parseIsoDate('2001-02-03T04:05Z');
    const expected = Date.UTC(2001, 1, 3, 4, 5, 0, 0);
    expect(result).toBe(expected);
  });
  test('2001-02-03T04:05:06Z', () => {
    const result = parseIsoDate('2001-02-03T04:05:06Z');
    const expected = Date.UTC(2001, 1, 3, 4, 5, 6, 0);
    expect(result).toBe(expected);
  });
  test('2001-02-03T04:05:06.007Z', () => {
    const result = parseIsoDate('2001-02-03T04:05:06.007Z');
    const expected = Date.UTC(2001, 1, 3, 4, 5, 6, 7);
    expect(result).toBe(expected);
  });

  test('2001-02-03T04:05-00:00', () => {
    const result = parseIsoDate('2001-02-03T04:05-00:00');
    const expected = Date.UTC(2001, 1, 3, 4, 5, 0, 0);
    expect(result).toBe(expected);
  });
  test('2001-02-03T04:05:06-00:00', () => {
    const result = parseIsoDate('2001-02-03T04:05:06-00:00');
    const expected = Date.UTC(2001, 1, 3, 4, 5, 6, 0);
    expect(result).toBe(expected);
  });
  test('2001-02-03T04:05:06.007-00:00', () => {
    const result = parseIsoDate('2001-02-03T04:05:06.007-00:00');
    const expected = Date.UTC(2001, 1, 3, 4, 5, 6, 7);
    expect(result).toBe(expected);
  });

  test('2001-02-03T04:05+00:00', () => {
    const result = parseIsoDate('2001-02-03T04:05+00:00');
    const expected = Date.UTC(2001, 1, 3, 4, 5, 0, 0);
    expect(result).toBe(expected);
  });
  test('2001-02-03T04:05:06+00:00', () => {
    const result = parseIsoDate('2001-02-03T04:05:06+00:00');
    const expected = Date.UTC(2001, 1, 3, 4, 5, 6, 0);
    expect(result).toBe(expected);
  });
  test('2001-02-03T04:05:06.007+00:00', () => {
    const result = parseIsoDate('2001-02-03T04:05:06.007+00:00');
    const expected = Date.UTC(2001, 1, 3, 4, 5, 6, 7);
    expect(result).toBe(expected);
  });

  test('2001-02-03T04:05-06:30', () => {
    const result = parseIsoDate('2001-02-03T04:05-06:30');
    const expected = Date.UTC(2001, 1, 3, 4, 5, 0, 0) + sixHoursThirty;
    expect(result).toBe(expected);
  });
  test('2001-02-03T04:05:06-06:30', () => {
    const result = parseIsoDate('2001-02-03T04:05:06-06:30');
    const expected = Date.UTC(2001, 1, 3, 4, 5, 6, 0) + sixHoursThirty;
    expect(result).toBe(expected);
  });
  test('2001-02-03T04:05:06.007-06:30', () => {
    const result = parseIsoDate('2001-02-03T04:05:06.007-06:30');
    const expected = Date.UTC(2001, 1, 3, 4, 5, 6, 7) + sixHoursThirty;
    expect(result).toBe(expected);
  });

  test('2001-02-03T04:05+06:30', () => {
    const result = parseIsoDate('2001-02-03T04:05+06:30');
    const expected = Date.UTC(2001, 1, 3, 4, 5, 0, 0) - sixHoursThirty;
    expect(result).toBe(expected);
  });
  test('2001-02-03T04:05:06+06:30', () => {
    const result = parseIsoDate('2001-02-03T04:05:06+06:30');
    const expected = Date.UTC(2001, 1, 3, 4, 5, 6, 0) - sixHoursThirty;
    expect(result).toBe(expected);
  });
  test('2001-02-03T04:05:06.007+06:30', () => {
    const result = parseIsoDate('2001-02-03T04:05:06.007+06:30');
    const expected = Date.UTC(2001, 1, 3, 4, 5, 6, 7) - sixHoursThirty;
    expect(result).toBe(expected);
  });

  test('2001T04:05:06.007', () => {
    const result = parseIsoDate('2001T04:05:06.007');
    const expected = Date.UTC(2001, 0, 1, 4, 5, 6, 7);
    expect(result).toBe(expected);
  });
  test('2001-02T04:05:06.007', () => {
    const result = parseIsoDate('2001-02T04:05:06.007');
    const expected = Date.UTC(2001, 1, 1, 4, 5, 6, 7);
    expect(result).toBe(expected);
  });

  test('-010000T04:05', () => {
    const result = parseIsoDate('-010000T04:05');
    const expected = Date.UTC(-10000, 0, 1, 4, 5, 0, 0);
    expect(result).toBe(expected);
  });
  test('-010000-02T04:05', () => {
    const result = parseIsoDate('-010000-02T04:05');
    const expected = Date.UTC(-10000, 1, 1, 4, 5, 0, 0);
    expect(result).toBe(expected);
  });
  test('-010000-02-03T04:05', () => {
    const result = parseIsoDate('-010000-02-03T04:05');
    const expected = Date.UTC(-10000, 1, 3, 4, 5, 0, 0);
    expect(result).toBe(expected);
  });

  test('invalid date-time (missing T)', () => {
    expect(parseIsoDate('1970-01-01 00:00:00')).toBeNaN();
  });
  test('invalid date-time (too many characters in millisecond part)', () => {
    expect(parseIsoDate('1970-01-01T00:00:00.000000')).toBeNaN();
  });
  test('invalid date-time (comma instead of dot)', () => {
    expect(parseIsoDate('1970-01-01T00:00:00,000')).toBeNaN();
  });
  test('invalid date-time (missing colon in timezone part)', () => {
    expect(parseIsoDate('1970-01-01T00:00:00+0630')).toBeNaN();
  });
  test('invalid date-time (missing colon in time part)', () => {
    expect(parseIsoDate('1970-01-01T0000')).toBeNaN();
  });
  test('invalid date-time (msec with missing seconds)', () => {
    expect(parseIsoDate('1970-01-01T00:00.000')).toBeNaN();
  });
});
