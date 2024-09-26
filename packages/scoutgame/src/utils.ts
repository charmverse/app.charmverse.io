import { DateTime } from 'luxon';

export const timezone = 'America/New_York';

export const currentSeason = 1;

// Season 1 started on 2024-09-22
// TODO: Make sure to update this before the season starts
export const currentSeasonStartDate = DateTime.fromObject({ year: 2024, month: 9, day: 22 }, { zone: timezone });
export const currentSeasonEndDate = currentSeasonStartDate.plus({ weeks: 13 });

export const streakWindow = 7 * 24 * 60 * 60 * 1000;

// Return the format of week
export function getCurrentWeek() {
  return getFormattedWeek(new Date());
}

export function getLastWeek() {
  return getFormattedWeek(DateTime.now().minus({ week: 1 }).toJSDate());
}

// get the number of the current week, with Sunday being the first day of the week in New York time
export function getFormattedWeek(date: Date): string {
  return formatWeek(getWeek(date));
}

export function getWeekStartEnd(date: Date) {
  const newYorkDate = DateTime.fromJSDate(date, { zone: timezone });

  // Shift the weekday to make Sunday the first day of the week
  const dayOfWeek = newYorkDate.weekday % 7; // Sunday = 0, Monday = 1, ..., Saturday = 6

  // Find the start of the week (Sunday)
  const startOfWeek = newYorkDate.minus({ days: dayOfWeek }).startOf('day');
  const endOfWeek = startOfWeek.plus({ days: 7 });
  return { start: startOfWeek, end: endOfWeek };
}

function formatWeek({ year, week }: { year: number; week: number }) {
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

// weeks start on Sunday. The year depends on the Sunday of the current week.
// So if Jan 1 is on a Wednesday, the first week of the year starts on the Sunday of the next week.
export function getWeek(date: Date): { week: number; year: number } {
  // Get the current date in the specified timezone
  const newYorkDate = DateTime.fromJSDate(date, { zone: timezone });

  // Shift the weekday to make Sunday the first day of the week
  const dayOfWeek = newYorkDate.weekday % 7; // Sunday = 0, Monday = 1, ..., Saturday = 6

  // Find the start of the week (Sunday)
  const startOfWeek = newYorkDate.minus({ days: dayOfWeek });

  // Calculate the week number by comparing to the start of the year
  const startOfYear = DateTime.fromObject({ year: newYorkDate.year, month: 1, day: 1 }, { zone: timezone });
  const startOfYearDayOfWeek = startOfYear.weekday % 7;
  const diffInDays = Math.floor(
    startOfWeek
      .diff(startOfYear, 'days')
      // Adjust for the start of the year being in the middle of the week
      .minus({ days: startOfYearDayOfWeek }).days
  );

  // Calculate the week number, rounding down to the nearest week
  const weekNumber = Math.floor(diffInDays / 7) + 1;

  // if the week number is 53, it means the last day of the year falls on the first week of the next year
  if (weekNumber === 0) {
    return { week: 52, year: newYorkDate.year - 1 };
  }
  return { week: weekNumber, year: newYorkDate.year };
}

export function isToday(date: Date) {
  const dateDay = DateTime.fromJSDate(date, { zone: timezone }).startOf('day');
  return dateDay.equals(DateTime.now().setZone(timezone).startOf('day'));
}

export function getCurrentWeekPoints() {
  // TODO: Get points allocation for the week
  return 100000;
}

export function getCurrentWeekNumber() {
  const currentDate = DateTime.now().setZone(timezone);
  const weeksDiff = currentDate.diff(currentSeasonStartDate, 'weeks').weeks;
  return Math.floor(weeksDiff) + 1;
}

export function getSeasonWeekNumberFromWeek({ seasonStartDate, week }: { week: string; seasonStartDate: DateTime }) {
  const [year, weekNumber] = week.split('-W');
  const date = DateTime.fromObject({ year: parseInt(year), day: 1, month: 1 }, { zone: timezone }).plus({
    weeks: parseInt(weekNumber)
  });
  const weeksDiff = date.diff(seasonStartDate, 'weeks').weeks;
  return Math.round(weeksDiff);
}
