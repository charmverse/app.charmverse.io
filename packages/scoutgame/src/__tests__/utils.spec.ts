import { DateTime } from 'luxon';

import { getFormattedWeek, getWeekStartEnd, getSeasonWeekNumberFromWeek } from '../utils';

describe('getFormattedWeek', () => {
  it('should return the previous year when the first day of the year is a Sunday', () => {
    const jan1 = DateTime.fromObject({ year: 2023, month: 1, day: 1 }, { zone: 'utc' }).toJSDate();
    expect(getFormattedWeek(jan1)).toEqual('2022-W52');
  });
  it('should start on Monday', () => {
    const dec31 = DateTime.fromObject({ year: 2023, month: 1, day: 2 }, { zone: 'utc' }).toJSDate();
    expect(getFormattedWeek(dec31)).toEqual('2023-W01');
  });

  // leap year date pulled from https://en.wikipedia.org/wiki/ISO_week_date
  it('handle leap years with 53 weeks', () => {
    const dec31 = DateTime.fromObject({ year: 1982, month: 1, day: 3 }, { zone: 'utc' }).toJSDate();
    expect(getFormattedWeek(dec31)).toEqual('1981-W53');
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

describe('getSeasonWeekNumberFromWeek', () => {
  it('should return the season week number when the season is ahead of the current week', () => {
    const currentSeasonWeek = 3;
    const currentSeasonStartDate = DateTime.fromObject({ year: 2024, month: 9, day: 2 }, { zone: 'utc' });
    const currentSeasonDate = currentSeasonStartDate.plus({
      weeks: currentSeasonWeek - 1
    });
    const formattedWeek = getFormattedWeek(currentSeasonDate.toJSDate());
    expect(getSeasonWeekNumberFromWeek({ week: formattedWeek, seasonStartDate: currentSeasonStartDate })).toEqual(
      currentSeasonWeek
    );
  });

  it('should return the season week number when the season is behind the current week', () => {
    const currentSeasonWeek = 10;
    const currentSeasonStartDate = DateTime.fromObject({ year: 2024, month: 10, day: 28 }, { zone: 'utc' }); // Nov 1, 2024 is a Monday
    const currentSeasonDate = currentSeasonStartDate.plus({
      weeks: currentSeasonWeek - 1
    });
    const formattedWeek = getFormattedWeek(currentSeasonDate.toJSDate());
    expect(getSeasonWeekNumberFromWeek({ week: formattedWeek, seasonStartDate: currentSeasonStartDate })).toEqual(
      currentSeasonWeek
    );
  });
});
