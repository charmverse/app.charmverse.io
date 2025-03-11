import {
  conditionalPlural,
  sanitizeForRegex,
  isUrl,
  isValidEmail,
  stringSimilarity,
  concatenateStringValues
} from '../strings';

describe('strings', () => {
  it('should sanitize parenthesis in a regex', () => {
    const text = sanitizeForRegex('test (test)');

    expect(text).toBe('test \\(test\\)');
  });
});

describe('conditionalPlural', () => {
  it('should return the word if the number is 1', () => {
    expect(conditionalPlural({ word: 'test', count: 1 })).toBe('test');
  });
  it('should append the letter "s" to a word if the number if not 1', () => {
    expect(conditionalPlural({ word: 'test', count: 2 })).toBe('tests');
  });

  it('should return plural if provided and the number is not 1', () => {
    expect(conditionalPlural({ word: 'Identity', count: 2, plural: 'Identities' })).toBe('Identities');
  });
});

describe('isUrl()', () => {
  const validUrls = [
    'https://x.com',
    'https://docs.google.com/forms/d/e/1FAIpQLSf-Z7e_l7htY7DO6GQuzkW2KWsqUOcXjzLS2fwvWnapvfltEQ/viewform',
    'https://www.loom.com/share/d0e3f7b3abb6448eb0c7a00bdd6dcd90',
    'https://en.m.wikipedia.org/wiki/C_Sharp_(programming_language)',
    'https://zh.wikipedia.org/wiki/Wikipedia:维基百科:关于中文维基百科/en',
    'https://odysee.com/@Coldfusion:f/google-panics-over-chatgpt-the-ai-wars:a'
  ];

  validUrls.forEach((url) => {
    it(`should return true for ${url}`, () => {
      expect(isUrl(url)).toBe(true);
    });
  });

  const invalidUrls = ['', 'hippo!', 'https://www', 'mailto://mail@freecodecamp.org'];
  invalidUrls.forEach((url) => {
    it(`should return false for ${url}`, () => {
      expect(isUrl(url)).toBe(false);
    });
  });
});
describe('isValidEmail', () => {
  it('should return true for a corporate email', () => {
    expect(isValidEmail('hello@charmverse.io')).toBe(true);
  });

  it('should return true for a free email', () => {
    expect(isValidEmail('test@gmail.com')).toBe(true);
  });

  // TBC - If we do this
  // it('should return true when email contains non-latin characters', () => {
  //   expect(isValidEmail('アシッシュ@ビジネス.コム')).toBe(true);
  // });

  it('should return false for an invalid email', () => {
    expect(isValidEmail('hello')).toBe(false);
    expect(isValidEmail('charmverse.io')).toBe(false);
  });
});

describe('stringSimilarity()', () => {
  const threshold = 0.2;

  it('should return 1 for identical strings', () => {
    expect(stringSimilarity('hello', 'hello')).toBe(1);
  });
  it('should return 0 for completely different strings', () => {
    expect(stringSimilarity('hello', 'world')).toBe(0);
  });
  it('should return a value between 0 and 1 for similar strings', () => {
    expect(stringSimilarity('hello', 'hell')).toBeGreaterThan(0);
    expect(stringSimilarity('hello', 'hell')).toBeLessThan(1);
  });

  it('should return below the threshold (that we use in production)', () => {
    expect(stringSimilarity('a', 'b')).toBeLessThan(threshold);
    expect(stringSimilarity('', 'a non empty string')).toBeLessThan(threshold);
  });

  it('should return above the threshold (that we use in production)', () => {
    expect(stringSimilarity('DateCreated', 'CreatedDate')).toBeGreaterThanOrEqual(threshold);
    expect(stringSimilarity('WolfmanJackIsDaBomb', 'WolfmanJackIsDaBest')).toBeGreaterThanOrEqual(threshold);
    expect(stringSimilarity('Phyllis', 'PyllisX')).toBeGreaterThanOrEqual(threshold);
    expect(stringSimilarity('Phyllis', 'Pylhlis')).toBeGreaterThanOrEqual(threshold);
    expect(stringSimilarity('a whole long thing', 'a whole')).toBeGreaterThanOrEqual(threshold);
    expect(stringSimilarity('Template with', 'temp')).toBeGreaterThanOrEqual(threshold);
  });
});

describe('concatenateStringValues', () => {
  it('should concatenate all string values from the object into an array', () => {
    const input = {
      key1: 'hello',
      key2: 'world',
      key3: 42,
      key4: 'typescript'
    };

    const result = concatenateStringValues(input);
    expect(result).toEqual(['hello', 'world', 'typescript']);
  });

  it('should return an empty array if no string values are present', () => {
    const input = {
      key1: 1,
      key2: true,
      key3: {},
      key4: []
    };

    const result = concatenateStringValues(input);
    expect(result).toEqual([]);
  });

  it('should handle an empty object', () => {
    const input = {};

    const result = concatenateStringValues(input);
    expect(result).toEqual([]);
  });

  it('should ignore non-string values and join the remaining strings with commas', () => {
    const input = {
      key1: 'test',
      key2: null,
      key3: 'jest',
      key4: 123
    };

    const result = concatenateStringValues(input);
    expect(result).toEqual(['test', 'jest']);
  });

  it('should join array of strings and concatenate with other string values', () => {
    const input = {
      key1: 'first',
      key2: ['apple', 'banana'],
      key3: 'second',
      key4: [1, 2, 'grape'],
      key5: ['carrot', 123]
    };

    const result = concatenateStringValues(input);
    expect(result).toEqual(['first', 'apple, banana', 'second', 'grape', 'carrot']);
  });

  it('should ignore arrays without strings', () => {
    const input = {
      key1: 'test',
      key2: [1, 2, 3],
      key3: 'example'
    };

    const result = concatenateStringValues(input);
    expect(result).toEqual(['test', 'example']);
  });
});
