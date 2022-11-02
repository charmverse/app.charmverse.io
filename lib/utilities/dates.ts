
import type { DateTimeUnit as LuxonTimeUnit } from 'luxon';
import { Duration, DateTime } from 'luxon';

export type DateInput = DateTime | Date | string | number;

export type DateTimeFormat = 'relative' | 'absolute'

export type TimeUnit = 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'

const SystemToLuxonUnitMapping: { [key in TimeUnit]: LuxonTimeUnit } = {
  millisecond: 'millisecond',
  second: 'second',
  minute: 'minute',
  hour: 'hour',
  day: 'day',
  week: 'week',
  month: 'month',
  year: 'year'
};

export function convertToLuxonDate (date: DateInput): DateTime {
  if (date instanceof DateTime) {
    return date;
  }
  if (typeof date === 'number') {
    return DateTime.fromMillis(date);
  }
  if (typeof date === 'string') {
    return DateTime.fromISO(date);
  }
  return DateTime.fromJSDate(date);
}

export function getTimeDifference (
  targetTime: DateInput,
  unit: TimeUnit,
  referenceTime: DateInput = new Date()
): number {
  const timeUnit = SystemToLuxonUnitMapping[unit];

  const timeToAssess = convertToLuxonDate(targetTime).startOf(timeUnit);
  const baseTime = convertToLuxonDate(referenceTime).startOf(timeUnit);

  const timeDifference = timeToAssess.diff(baseTime, timeUnit);

  return timeDifference[`${timeUnit}s`];
}

export function humanFriendlyDate (date: DateInput, options: {
  withYear?: boolean;
  withTime?: boolean; } = {
  withYear: false,
  withTime: false
}): string {
  const parsedDate = convertToLuxonDate(date);

  /**
   * See these tables for the conversion tokens
   * https://moment.github.io/luxon/#/formatting?id=table-of-tokens
   */

  let formatString = 'MMM d';

  if (options?.withYear === true) {
    formatString += ', yyyy';
  }

  if (options?.withTime === true) {
    formatString += ' \'at\' hh:mm a';
  }

  const formatted = parsedDate.toFormat(formatString);

  return formatted;
}

export function toMonthDate (date: DateInput): string {
  const parsedDate = convertToLuxonDate(date);

  return parsedDate.toFormat('MMM d');
}

export function showDateWithMonthAndYear (dateInput: Date | string, showDate?: boolean) {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return `${date.toLocaleString('default', {
    month: 'long'
  })}${showDate ? ` ${date.getDate()},` : ''} ${date.getFullYear()}`;
}

/**
 * Returns a string representation of a this time relative to now, such as "in two days".
 */
export function relativeTime (dateInput: DateInput) {

  dateInput = coerceToMilliseconds(dateInput);

  return DateTime.fromJSDate(new Date(dateInput)).toRelative({ base: DateTime.now() });
}

export function coerceToMilliseconds (timestamp: DateInput): number {
  if (typeof timestamp === 'number' && timestamp.toString().length <= 10) {
    return timestamp * 1000;
  }

  return timestamp instanceof DateTime ? timestamp.toMillis() : new Date(timestamp).valueOf();
}

export function toHoursAndMinutes (totalMinutes: number) {
  return `${Duration.fromObject({ hours: totalMinutes / 60 }, {
    numberingSystem: ''
  }).toFormat('hh')}:${Duration.fromObject({ minutes: totalMinutes % 60 }).toFormat('mm')}`;
}

export function getTimezonesWithOffset () {
  let timezones: string[] = [];
  if ((Intl as any).supportedValuesOf) {
    timezones = (Intl as any).supportedValuesOf('timeZone');
  }

  return timezones.map(timeZone => {
    const tzOffset = DateTime.local().setZone(timeZone).offset;
    return {
      offset: toHoursAndMinutes(tzOffset),
      tz: timeZone
    };
  });
}
