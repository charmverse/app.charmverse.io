import { sanitizeForRegex } from '../strings';

describe('strings', () => {
  it('should sanitize parenthesis in a regex', () => {
    const text = sanitizeForRegex('test (test)');

    expect(text).toBe('test \\(test\\)');
  });
});
