import { extractRuUrls } from '../extractRuUrls';

describe('extractRuUrls', () => {
  test('extracts .ru URLs with http', () => {
    const text = 'Visit http://example.ru for information.';
    expect(extractRuUrls(text)).toEqual(['http://example.ru']);
  });

  test('extracts .ru URLs with https', () => {
    const text = 'Check out https://secure-example.ru.';
    expect(extractRuUrls(text)).toEqual(['https://secure-example.ru']);
  });

  test('extracts URLs with just .ru', () => {
    const text = 'Mention example.ru in the text.';
    expect(extractRuUrls(text)).toEqual(['example.ru']);
  });

  test('extracts multiple .ru URLs in one text', () => {
    const text = 'Visit http://example.ru, https://another-example.ru, and just example.ru today.';
    expect(extractRuUrls(text)).toEqual(['http://example.ru', 'https://another-example.ru', 'example.ru']);
  });

  test('extracts .ru URLs with query parameters', () => {
    const text = 'Find details at http://example.ru?param=value.';
    expect(extractRuUrls(text)).toEqual(['http://example.ru']);
  });

  test('returns an empty array for text without .ru URLs', () => {
    const text = 'Visit our site at http://example.com.';
    expect(extractRuUrls(text)).toEqual([]);
  });

  test('handles mixed content with .ru URLs and other text', () => {
    const text = 'For more, see http://example.ru, example.ru or contact us at info@example.com.';
    expect(extractRuUrls(text)).toEqual(['http://example.ru', 'example.ru']);
  });

  test('ignores .ru in email addresses', () => {
    const text = 'Contact me at user@example.ru.';
    expect(extractRuUrls(text)).toEqual([]);
  });
});
