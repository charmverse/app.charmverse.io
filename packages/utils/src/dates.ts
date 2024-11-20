import { DateTime } from 'luxon';

export function getRelativeTime(date: Date | string) {
  return DateTime.fromISO(typeof date === 'string' ? date : date.toISOString())
    .toRelative({
      style: 'narrow',
      locale: 'en',
      round: true
    })
    ?.replace(' ago', '');
}

export function timeUntilFuture(date?: number) {
  if (!date) {
    return null; // No future dates available
  }

  const now = new Date().getTime();
  const timeDifference = date - now;

  const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

  const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
    2,
    '0'
  )}`;

  return { days, timeString, hours, minutes, seconds };
}

export function getUniqueWeeksCount(events: Date[]): number {
  // Helper function to calculate the ISO week number
  function getWeekNumber(date: Date): number {
    const tempDate = new Date(date.getTime());
    tempDate.setUTCHours(0, 0, 0, 0);
    // Thursday in the current week decides the year
    tempDate.setDate(tempDate.getDate() + 3 - ((tempDate.getDay() + 6) % 7));
    // January 4 is always in week 1
    const week1 = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 4));
    // Calculate the full weeks to the date
    return Math.ceil(((tempDate.getTime() - week1.getTime()) / 86400000 + 1) / 7);
  }

  const weeks = new Set<string>();

  events.forEach((event) => {
    const date = event;
    // Get the year and week number for the event
    const year = date.getFullYear();
    const week = getWeekNumber(date);
    weeks.add(`${year}-W${week}`);
  });

  return weeks.size;
}
