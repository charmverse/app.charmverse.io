import type { DateTimeUnit as LuxonTimeUnit, DurationLikeObject } from 'luxon';
import { Duration, DateTime } from 'luxon';

import { capitalize } from './strings';

export type DateInput = DateTime | Date | string | number;
export type DateTimeFormat = 'relative' | 'absolute';

export type TimeUnit = 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

export type DateFormatConfig = {
  month?: Intl.DateTimeFormatOptions['month'];
  withYear?: boolean;
};

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

export function timeAgo(duration: DurationLikeObject): Date {
  return DateTime.local().minus(Duration.fromObject(duration)).toJSDate();
}

export function convertToLuxonDate(date: DateInput): DateTime {
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

export function getTimeDifference(
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

/**
 * Returns a string representation of a this time relative to now, such as "in two days".
 */
export function relativeTime(dateInput: DateInput) {
  dateInput = coerceToMilliseconds(dateInput);

  return DateTime.fromJSDate(new Date(dateInput)).toRelative({ base: DateTime.now() });
}

/**
 * Returns past times or dates when the user has edited a document, similar to Notion
 *
 * @param date Date
 * @returns string
 */
export const getRelativeTimeInThePast = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const toSec = Math.round(diff / 1000);
  const toMin = Math.round(toSec / 60);
  const toHour = Math.round(toMin / 60);

  switch (true) {
    case toSec < 60:
      return 'just now';
    case toMin < 60:
      return `${toMin}m ago`;
    case toHour < 24:
      return `${toHour}h ago`;
    case toHour >= 24 && now.getFullYear() - date.getFullYear() === 0:
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    default:
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
};

// For grouping search results: today, yesterday, past week, past 30 days, older
export const getRelativeDateInThePast = (dateStr: string, now: DateTime = DateTime.local()): string => {
  const date = DateTime.fromISO(dateStr);
  const daysAgo = date.diff(now, 'days').days * -1;

  switch (true) {
    case daysAgo > 30:
      return 'Older';
    case daysAgo > 7:
      return `Past 30 days`;
    case daysAgo > 2:
      return `Past week`;
    default:
      return capitalize(date.toRelativeCalendar({ base: now, unit: 'days' }) || '');
  }
};

export function coerceToMilliseconds(timestamp: DateInput): number {
  if (typeof timestamp === 'number' && timestamp.toString().length <= 10) {
    return timestamp * 1000;
  }

  return timestamp instanceof DateTime ? timestamp.toMillis() : new Date(timestamp).valueOf();
}

export function toHoursAndMinutes(totalMinutes: number) {
  return `${Duration.fromObject(
    { hours: totalMinutes / 60 },
    {
      numberingSystem: ''
    }
  ).toFormat('hh')}:${Duration.fromObject({ minutes: totalMinutes % 60 }).toFormat('mm')}`;
}

export function getTimezonesWithOffset() {
  let timezones: string[] = [];
  if ((Intl as any).supportedValuesOf) {
    timezones = (Intl as any).supportedValuesOf('timeZone');
  }

  return timezones.map((timeZone) => {
    const tzOffset = DateTime.local().setZone(timeZone).offset;
    return {
      offset: toHoursAndMinutes(tzOffset),
      tz: timeZone
    };
  });
}

export function getFormattedDateTime(
  dateInput: Date | string,
  options?: Intl.DateTimeFormatOptions,
  locale?: string | null
) {
  const date = new Date(dateInput);
  const isLocaleSupported = toLocaleDateStringSupportsLocales();
  const formatLocale = isLocaleSupported ? locale || 'default' : undefined;

  try {
    return date.toLocaleString(formatLocale, options);
  } catch (e: any) {
    return date.toLocaleString('default', options);
  }
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString#checking_for_support_for_locales_and_options_arguments
function toLocaleDateStringSupportsLocales() {
  try {
    new Date().toLocaleDateString('i');
  } catch (e: any) {
    return e.name === 'RangeError';
  }

  return false;
}

export function formatDateTime(dateInput: Date | string, locale?: string | null) {
  return getFormattedDateTime(
    dateInput,
    {
      dateStyle: 'short',
      timeStyle: 'short'
    },
    locale
  );
}

export function formatDate(dateInput: Date | string, config?: DateFormatConfig, locale?: string | null) {
  // Add year by default if date is not in current year
  const isCurrentYear = new Date().getFullYear() === new Date(dateInput).getFullYear();

  return getFormattedDateTime(
    dateInput,
    {
      day: 'numeric',
      month: config?.month ?? 'short',
      year: (config?.withYear ?? !isCurrentYear) ? 'numeric' : undefined
    },
    locale
  );
}

export function formatTime(dateInput: Date | string, locale?: string | null) {
  return getFormattedDateTime(dateInput, { timeStyle: 'short' }, locale);
}

export function sortByDate<T extends { createdAt: string | Date }>(a: T, b: T): number {
  if (a.createdAt > b.createdAt) {
    return -1;
  } else if (a.createdAt < b.createdAt) {
    return 1;
  } else {
    return 0;
  }
}

export function getCurrentDate() {
  // Use static time for Storybook
  return process.env.IS_STORYBOOK ? new Date('2021-10-01T00:00:00.000Z') : new Date();
}
