export interface TzParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export function getWallClock(date: Date, timeZone: string): TzParts {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: parseInt(parts.year, 10),
    month: parseInt(parts.month, 10),
    day: parseInt(parts.day, 10),
    hour: parseInt(parts.hour, 10),
    minute: parseInt(parts.minute, 10),
  };
}

/**
 * Convert wall-clock time in an IANA timezone to a UTC instant.
 * Deterministic: resolves the offset by iterating until the requested wall
 * clock is produced in that zone (handles DST transitions).
 */
export function wallClockToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
): Date {
  let utcGuess = Date.UTC(year, month - 1, day, hour, minute);
  for (let i = 0; i < 3; i++) {
    const asTz = getWallClock(new Date(utcGuess), timeZone);
    const asIfUtc = Date.UTC(asTz.year, asTz.month - 1, asTz.day, asTz.hour, asTz.minute);
    const diff = Date.UTC(year, month - 1, day, hour, minute) - asIfUtc;
    if (diff === 0) break;
    utcGuess += diff;
  }
  return new Date(utcGuess);
}

/**
 * Shift wall-clock calendar days deterministically (DST-agnostic: operates on
 * the civil Y/M/D, not on 24h multiples).
 */
export function addWallDays(parts: TzParts, days: number): TzParts {
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: parts.hour,
    minute: parts.minute,
  };
}

/**
 * UTC bounds of the calendar day containing `instant`, expressed in
 * `timeZone`. Use with interval-overlap semantics (start < dayEnd AND
 * end > dayStart) so midnight-spanning events are never missed.
 */
export function userDayBounds(
  instant: Date,
  timeZone: string
): { dayStartUtc: Date; dayEndUtc: Date } {
  const parts = getWallClock(instant, timeZone);
  const next = addWallDays(parts, 1);
  return {
    dayStartUtc: wallClockToUtc(parts.year, parts.month, parts.day, 0, 0, timeZone),
    dayEndUtc: wallClockToUtc(next.year, next.month, next.day, 0, 0, timeZone),
  };
}
