import { getCurrentWeek, validateISOWeek } from '../../dates';

describe('validateIsoWeek', () => {
  test('should return the right boolean', () => {
    expect(validateISOWeek('2022-W01')).toBe(false);
    expect(validateISOWeek('2024-W53')).toBe(false);
    expect(validateISOWeek('2025-W53')).toBe(false);
    expect(validateISOWeek('2025-W1')).toBe(false);
    expect(validateISOWeek('2024-W40')).toBe(true);
    expect(validateISOWeek('2024-W01')).toBe(true);
    expect(validateISOWeek(getCurrentWeek())).toBe(true);
  });
});
