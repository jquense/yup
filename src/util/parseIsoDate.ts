/**
 * This file is a modified version of the file from the following repository:
 * Date.parse with progressive enhancement for ISO 8601 <https://github.com/csnover/js-iso8601>
 * NON-CONFORMANT EDITION.
 * © 2011 Colin Snover <http://zetafleet.com>
 * Released under MIT license.
 */

// prettier-ignore
//                1 YYYY                2 MM        3 DD              4 HH     5 mm        6 ss           7 msec         8 Z 9 ±   10 tzHH    11 tzmm
const isoReg = /^(\d{4}|[+-]\d{6})(?:-?(\d{2})(?:-?(\d{2}))?)?(?:[ T]?(\d{2}):?(\d{2})(?::?(\d{2})(?:[,.](\d{1,}))?)?(?:(Z)|([+-])(\d{2})(?::?(\d{2}))?)?)?$/;

function toNumber(str: string, defaultValue = 0) {
  return Number(str) || defaultValue;
}

export function parseIsoDate(date: string): number {
  const regexResult = isoReg.exec(date);
  if (!regexResult) return Date.parse ? Date.parse(date) : Number.NaN;

  // use of toNumber() avoids NaN timestamps caused by “undefined”
  // values being passed to Date constructor
  const struct = {
    year: toNumber(regexResult[1]),
    month: toNumber(regexResult[2], 1) - 1,
    day: toNumber(regexResult[3], 1),
    hour: toNumber(regexResult[4]),
    minute: toNumber(regexResult[5]),
    second: toNumber(regexResult[6]),
    millisecond: regexResult[7]
      ? // allow arbitrary sub-second precision beyond milliseconds
        toNumber(regexResult[7].substring(0, 3))
      : 0,
    z: regexResult[8] || undefined,
    plusMinus: regexResult[9] || undefined,
    hourOffset: toNumber(regexResult[10]),
    minuteOffset: toNumber(regexResult[11]),
  };

  // timestamps without timezone identifiers should be considered local time
  if (struct.z === undefined && struct.plusMinus === undefined) {
    return new Date(
      struct.year,
      struct.month,
      struct.day,
      struct.hour,
      struct.minute,
      struct.second,
      struct.millisecond,
    ).valueOf();
  }

  let totalMinutesOffset = 0;
  if (struct.z !== 'Z' && struct.plusMinus !== undefined) {
    totalMinutesOffset = struct.hourOffset * 60 + struct.minuteOffset;
    if (struct.plusMinus === '+') totalMinutesOffset = 0 - totalMinutesOffset;
  }

  return Date.UTC(
    struct.year,
    struct.month,
    struct.day,
    struct.hour,
    struct.minute + totalMinutesOffset,
    struct.second,
    struct.millisecond,
  );
}
