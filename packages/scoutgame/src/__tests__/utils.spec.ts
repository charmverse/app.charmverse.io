import { DateTime } from 'luxon';

import { getWeekFromDate, getWeekStartEnd, getSeasonWeekFromISOWeek } from '../utils';

describe('getWeekFromDate', () => {
  it('should return the previous year when the first day of the year is a Sunday', () => {
    const jan1 = DateTime.fromObject({ year: 2023, month: 1, day: 1 }, { zone: 'utc' }).toJSDate();
    expect(getWeekFromDate(jan1)).toEqual('2022-W52');
  });
  it('should start on Monday', () => {
    const dec31 = DateTime.fromObject({ year: 2023, month: 1, day: 2 }, { zone: 'utc' }).toJSDate();
    expect(getWeekFromDate(dec31)).toEqual('2023-W01');
  });

  // leap year date pulled from https://en.wikipedia.org/wiki/ISO_week_date
  it('handle leap years with 53 weeks', () => {
    const dec31 = DateTime.fromObject({ year: 1982, month: 1, day: 3 }, { zone: 'utc' }).toJSDate();
    expect(getWeekFromDate(dec31)).toEqual('1981-W53');
  });
});

describe('getWeekStartEnd', () => {
  it('should return start and end of the week', () => {
    const dec31 = new Date('2023-01-01T07:00:00.000Z'); // Dec 31, 2023 is a Sunday in NY
    const result = getWeekStartEnd(dec31);
    expect(result.start.toJSDate().toISOString()).toEqual('2023-01-01T05:00:00.000Z');
    expect(result.end.toJSDate().toISOString()).toEqual('2023-01-08T05:00:00.000Z');
  });
});

describe('getSeasonWeekFromISOWeek', () => {
  it('should return the season week number when the season is ahead of the current week', () => {
    const seasonWeek = 3;
    const seasonStartDate = DateTime.fromObject({ year: 2024, month: 9, day: 2 }, { zone: 'utc' });
    const season = getWeekFromDate(seasonStartDate.toJSDate());
    const currentSeasonDate = seasonStartDate.plus({
      weeks: seasonWeek - 1
    });
    const formattedWeek = getWeekFromDate(currentSeasonDate.toJSDate());
    expect(getSeasonWeekFromISOWeek({ week: formattedWeek, season })).toEqual(seasonWeek);
  });

  it('should return the season week number when the season is behind the current week', () => {
    const seasonWeek = 10;
    const seasonStartDate = DateTime.fromObject({ year: 2024, month: 10, day: 28 }, { zone: 'utc' }); // Oct 28, 2024 is a Monday
    const season = getWeekFromDate(seasonStartDate.toJSDate());
    const currentSeasonDate = seasonStartDate.plus({
      weeks: seasonWeek - 1
    });
    const formattedWeek = getWeekFromDate(currentSeasonDate.toJSDate());
    expect(getSeasonWeekFromISOWeek({ week: formattedWeek, season })).toEqual(seasonWeek);
  });
});
