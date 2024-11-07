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
