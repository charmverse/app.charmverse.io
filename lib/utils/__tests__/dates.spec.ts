import { DateTime } from 'luxon';

import { getRelativeDateInThePast } from '../dates';

describe('Date utils: getRelativeDateInThePast', () => {
  it('should display Today', () => {
    expect(getRelativeDateInThePast(DateTime.now().toISO())).toBe('Today');
  });
  it('should display Yesterday', () => {
    expect(getRelativeDateInThePast(DateTime.now().minus({ days: 1 }).toISO())).toBe('Yesterday');
  });
  it('should display 2 days ago', () => {
    expect(getRelativeDateInThePast(DateTime.now().minus({ days: 2 }).toISO())).toBe('2 days ago');
  });
  it('should display Past week', () => {
    expect(getRelativeDateInThePast(DateTime.now().minus({ days: 3 }).toISO())).toBe('Past week');
  });
  it('should display Past 30 days', () => {
    expect(getRelativeDateInThePast(DateTime.now().minus({ days: 8 }).toISO())).toBe('Past 30 days');
  });
  it('should display Older', () => {
    expect(getRelativeDateInThePast(DateTime.now().minus({ days: 31 }).toISO())).toBe('Older');
  });
});
