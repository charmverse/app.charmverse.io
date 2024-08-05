import { formatMoney } from '../formatting';

describe('amount formatting', () => {
  it('should be correct for values larger than 1', () => {
    const amount = formatMoney(2932.12345, 'USD', 'en-US');

    expect(amount).toBe('$2,932.12');
  });

  it('should be correct for values less than 1', () => {
    const amount = formatMoney(0.12345, 'USD', 'en-US');

    expect(amount).toBe('$0.1235');
  });
});
