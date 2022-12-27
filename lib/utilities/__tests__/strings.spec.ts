import { randomETHWalletAddress } from 'testing/generate-stubs';

import { conditionalPlural, sanitizeForRegex, shortenHex, shortWalletAddress } from '../strings';

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

describe('shortWalletAddress', () => {
  it('should shorten valid wallet addresses', () => {
    const address = randomETHWalletAddress();
    const shortAddress = shortWalletAddress(address);
    expect(shortAddress).toBe(shortenHex(address));
    expect(shortAddress.length).toBe(11);
  });

  it('should leave other strings unchanged', () => {
    const ignoredString = 'test';
    const invalidWallet = '0x123abc';

    expect(shortWalletAddress(ignoredString)).toBe(ignoredString);
    expect(shortWalletAddress(invalidWallet)).toBe(invalidWallet);
  });
});
