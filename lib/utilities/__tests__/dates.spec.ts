import { DateTime } from 'luxon';
import { getDaySuffix } from '../dates';

describe('humanFriendlyDate', () => {
  it('should return the correct suffix for a day of a month', () => {

    for (let i = 1; i <= 10; i++) {
      const date = DateTime.fromObject({
        day: i,
        month: 1
      });

      const suffix = getDaySuffix(date.valueOf());

      if (i === 1) {
        expect(suffix).toBe('st');
      }
      else if (i === 2) {
        expect(suffix).toBe('nd');
      }
      else if (i === 3) {
        expect(suffix).toBe('rd');
      }
      else {
        expect(suffix).toBe('th');
      }

    }
  });

  it('should "th" if the number is between 10 and 19', () => {

    for (let i = 10; i <= 19; i++) {
      const date = DateTime.fromObject({
        day: i,
        month: 1
      });

      const suffix = getDaySuffix(date.valueOf());

      expect(suffix).toBe('th');
    }
  });
});
