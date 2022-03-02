
import { DateTime, DateTimeUnit as LuxonTimeUnit } from 'luxon';

/**
 * Datestamps are created as YYYY-MM-DD
 */
export type DateStamp = `${number}-${number}-${number}`;

export type DateInput = Date | DateStamp | number;

export type DateTimeFormat = 'relative' | 'absolute'

export type TimeUnit = 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'

const millisecondsInSecond = 1000;

const secondsInMinute = 60;

const minutesInHour = 60;

const hoursInDay = 24;

const millisecondsInDay = millisecondsInSecond * secondsInMinute * minutesInHour * hoursInDay;

const secondsInHour = secondsInMinute * minutesInHour;

const SystemToLuxonUnitMapping: {[key in TimeUnit]: LuxonTimeUnit} = {
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
  return typeof date === 'number'
    ? DateTime.fromMillis(date)
    : typeof date === 'string'
      ? DateTime.fromISO(date)
      : DateTime.fromJSDate(date);
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

function getDaySuffix (dateTime: DateInput): string {
  const parsed = convertToLuxonDate(dateTime);

  let daySuffix = parsed.day.toString();

  // Get last character
  daySuffix = daySuffix.slice(daySuffix.length - 1);

  switch (daySuffix) {
    case '1':
      return 'st';

    case '2':
      return 'nd';

    case '3':
      return 'rd';

    default:
      return 'th';
  }

}

export function humanFriendlyDate (date: DateInput, options: {
  withYear?: boolean,
  withTime?: boolean} = {
  withYear: false,
  withTime: false
}): string {
  const parsedDate = convertToLuxonDate(date);
  /**
   * See these tables for the conversion tokens
   * https://moment.github.io/luxon/api-docs/index.html
   * Go to toFormat method
   *
   * https://moment.github.io/luxon/#/formatting?id=table-of-tokens
   * Cheatsheet of conversion tokens
   */

  let formatString = 'EEE, d MMM';

  if (options?.withYear === true) {
    formatString += ' yyyy';
  }

  if (options?.withTime === true) {
    formatString += ' HH:mm';
  }

  const formatted = parsedDate.toFormat(formatString);

  const month = parsedDate.monthShort;

  const splitted = formatted.split(month);

  const daySuffix = getDaySuffix(date);

  splitted[0] = `${splitted[0].trim() + daySuffix} `;

  return splitted.join(month);
}
