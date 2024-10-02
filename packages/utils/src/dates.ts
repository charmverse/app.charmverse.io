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
