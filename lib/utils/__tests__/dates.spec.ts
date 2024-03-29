import { DateTime } from 'luxon';

import { getRelativeDateInThePast } from '../dates';

// use static input for static results
const now = DateTime.fromISO('2024-03-30T12:00:00.000Z');

describe('Date utils: getRelativeDateInThePast', () => {
  it('should display Today', () => {
    expect(getRelativeDateInThePast(now.toISO(), now)).toBe('Today');
  });
  it('should display Yesterday', () => {
    expect(getRelativeDateInThePast(now.minus({ days: 1 }).toISO(), now)).toBe('Yesterday');
  });
  it('should display 2 days ago', () => {
    expect(getRelativeDateInThePast(now.minus({ days: 2 }).toISO(), now)).toBe('2 days ago');
  });
  it('should display Past week', () => {
    expect(getRelativeDateInThePast(now.minus({ days: 3 }).toISO(), now)).toBe('Past week');
  });
  it('should display Past 30 days', () => {
    expect(getRelativeDateInThePast(now.minus({ days: 8 }).toISO(), now)).toBe('Past 30 days');
  });
  it('should display Older', () => {
    expect(getRelativeDateInThePast(now.minus({ days: 31 }).toISO(), now)).toBe('Older');
  });
});
