import { DateTime } from 'luxon';

type ISOWeek = string; // isoweek, e.g. '2024-W01'
type SeasonWeek = number; // the week in the season, e.g. 1

// Season start MUST be on a Monday, when isoweek begins
const currentSeasonStartDate = DateTime.fromObject({ year: 2024, month: 9, day: 16 }, { zone: 'utc' }); // Dev Season: 2024-W38
// const currentSeasonStartDate = DateTime.fromObject({ year: 2024, month: 9, day: 30 }, { zone: 'utc' }); // Actual launch: 2024-W40
export const currentSeasonEndDate = currentSeasonStartDate.plus({ weeks: 13 });
export const currentSeason: ISOWeek = getWeekFromDate(currentSeasonStartDate.toJSDate());

export const streakWindow = 7 * 24 * 60 * 60 * 1000;

// Return the format of week
export function getCurrentWeek(): ISOWeek {
  return _formatWeek(DateTime.utc());
}

export function getLastWeek(): ISOWeek {
  return _formatWeek(DateTime.utc().minus({ week: 1 }));
}

export function getWeekFromDate(date: Date): ISOWeek {
  return _formatWeek(DateTime.fromJSDate(date, { zone: 'utc' }));
}

export function getDateFromISOWeek(week: ISOWeek): DateTime {
  return DateTime.fromISO(week, { zone: 'utc' });
}

export function getWeekStartEnd(date: Date) {
  const utcDate = DateTime.fromJSDate(date, { zone: 'utc' });
  const startOfWeek = utcDate.startOf('week');
  const endOfWeek = utcDate.endOf('week');
  return { start: startOfWeek, end: endOfWeek };
}

function _formatWeek(date: DateTime): ISOWeek {
  // token reference: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
  return date.toFormat(`kkkk-'W'WW`);
}

export function isToday(date: Date) {
  const dateDay = DateTime.fromJSDate(date, { zone: 'utc' }).startOf('day');
  return dateDay.equals(DateTime.utc().startOf('day'));
}

export function getCurrentWeekPoints() {
  // TODO: Get points allocation for the week
  return 100000;
}

export function getCurrentSeasonWeek(): SeasonWeek {
  return getSeasonWeekFromISOWeek({ season: currentSeason, week: getCurrentWeek() });
}

export function getSeasonWeekFromISOWeek({ season, week }: { season: ISOWeek; week: ISOWeek }): SeasonWeek {
  const weekDate = DateTime.fromISO(week, { zone: 'utc' });
  const seasonDate = DateTime.fromISO(season, { zone: 'utc' });
  const weeksDiff = weekDate.diff(seasonDate, 'weeks').weeks;
  return weeksDiff + 1;
}
