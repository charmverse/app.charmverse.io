import { removeApiKeyFromQuery } from '../removeApiKeyFromQuery';

describe('removeApiKeyFromQuery', () => {
  it('should remove api_key from the URL when it exists', () => {
    const url = 'www.url.com?api_key=1cbd9ed7-da3e-4ad3-ac86-0495460a484f&pageId=abcd';
    const sanitizedUrl = removeApiKeyFromQuery(url);
    expect(sanitizedUrl).toBe('www.url.com?pageId=abcd');
  });

  it('should return the same URL when api_key does not exist', () => {
    const url = 'www.url.com?pageId=abcd';
    const sanitizedUrl = removeApiKeyFromQuery(url);
    expect(sanitizedUrl).toBe('www.url.com?pageId=abcd');
  });
});
