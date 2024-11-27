import { getUniqueWeeksCount } from '../dates';

describe('getUniqueWeeksCount', () => {
  test('should return 0 for an empty array', () => {
    expect(getUniqueWeeksCount([])).toBe(0);
  });

  test('should return 1 when all dates fall in the same week', () => {
    const dates = [new Date('2024-01-01'), new Date('2024-01-02'), new Date('2024-01-03')];
    expect(getUniqueWeeksCount(dates)).toBe(1);
  });

  test('should return the correct count for dates in different weeks of the same year', () => {
    const dates = [
      new Date('2024-01-01'), // Week 1
      new Date('2024-01-08'), // Week 2
      new Date('2024-01-15'), // Week 3
      new Date('2024-01-22') // Week 4
    ];
    expect(getUniqueWeeksCount(dates)).toBe(4);
  });

  test('should return the correct count for dates spanning multiple years', () => {
    const dates = [
      new Date('2023-12-31'), // Week 52, 2023
      new Date('2024-01-01'), // Week 1, 2024
      new Date('2024-12-31') // Week 1, 2025
    ];
    expect(getUniqueWeeksCount(dates)).toBe(3);
  });

  test('should handle multiple events in the same week correctly', () => {
    const dates = [
      new Date('2024-01-01'), // Week 1
      new Date('2024-01-03'), // Week 1
      new Date('2024-01-15'), // Week 3
      new Date('2024-01-20') // Week 3
    ];
    expect(getUniqueWeeksCount(dates)).toBe(2);
  });

  test('should handle leap years correctly', () => {
    const dates = [
      new Date('2024-02-28'), // Week 9
      new Date('2024-02-29'), // Week 9
      new Date('2024-03-01') // Week 9
    ];
    expect(getUniqueWeeksCount(dates)).toBe(1);
  });

  test('should handle a large dataset correctly', () => {
    const dates = Array.from({ length: 400 }, (_, i) => new Date(2024, 0, i + 1)); // 400 consecutive days
    expect(getUniqueWeeksCount(dates)).toBe(58); // 58 unique weeks in this range
  });

  test('should return the correct count when weeks have gaps with no events', () => {
    const dates = [
      new Date('2024-01-01'), // Week 1
      new Date('2024-01-15'), // Week 3
      new Date('2024-01-29') // Week 5
    ];
    expect(getUniqueWeeksCount(dates)).toBe(3);
  });
});
