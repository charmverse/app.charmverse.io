import { DateTime } from 'luxon';

import { getFormattedWeek, getWeekStartEnd, getSeasonWeekNumberFromWeek } from '../utils';

// describe('getWeek should return the correct week', () => {
//   it('when the first day of the year is a Sunday', () => {
//     const dec31 = new Date('2023-01-01T07:00:00.000Z'); // Dec 31, 2023 is a Sunday in NY
//     expect(getWeek(dec31)).toEqual({ week: 1, year: 2023 });
//   });

//   it('when the last day of the year is a Sunday in a leap year with 53 Sundays', () => {
//     const dec31 = new Date('2023-12-31T07:00:00.000Z'); // Dec 31, 2023 is a Sunday in NY
//     expect(getWeek(dec31)).toEqual({ week: 53, year: 2023 });
//   });

//   it('when the first day of the year if it falls in the middle of a week', () => {
//     const jan01 = new Date('2024-01-01T07:00:00.000Z');
//     expect(getWeek(jan01)).toEqual({ week: 52, year: 2023 });
//   });

//   it('when the first day of the year starts on the last week of the previous year', () => {
//     const date = new Date('2025-01-01T07:00:00.000Z');
//     expect(getWeek(date)).toEqual({ year: 2024, week: 52 });
//   });
// });

describe('getFormattedWeek should return a correctly formatted week', () => {
  it('when the first day of the year is a Sunday', () => {
    const dec31 = new Date('2023-01-01T07:00:00.000Z'); // Dec 31, 2023 is a Sunday in NY
    expect(getFormattedWeek(dec31)).toEqual('2023-W01');
  });

  it('when the last day of the year is a Sunday in a leap year with 53 Sundays', () => {
    const dec31 = new Date('2023-12-31T07:00:00.000Z'); // Dec 31, 2023 is a Sunday in NY
    expect(getFormattedWeek(dec31)).toEqual('2023-W53');
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
    const currentSeasonStartDate = DateTime.fromObject({ year: 2024, month: 9, day: 1 }, { zone: 'utc' });
    const currentSeasonDate = currentSeasonStartDate.plus({
      weeks: currentSeasonWeek
    });
    const formattedWeek = getFormattedWeek(currentSeasonDate.toJSDate());
    expect(getSeasonWeekNumberFromWeek({ week: formattedWeek, seasonStartDate: currentSeasonStartDate })).toEqual(
      currentSeasonWeek
    );
  });

  it('should return the season week number when the season is behind the current week', () => {
    const currentSeasonWeek = 10;
    const currentSeasonStartDate = DateTime.fromObject({ year: 2024, month: 11, day: 1 }, { zone: 'utc' });
    const currentSeasonDate = currentSeasonStartDate.plus({
      weeks: currentSeasonWeek
    });
    const formattedWeek = getFormattedWeek(currentSeasonDate.toJSDate());
    expect(getSeasonWeekNumberFromWeek({ week: formattedWeek, seasonStartDate: currentSeasonStartDate })).toEqual(
      currentSeasonWeek
    );
  });
});
