import { getNewUrl, getSubdomainPath } from '../browser';

describe('getNewUrl()', () => {
  const urlBase = 'https://google.com';
  const url = `${urlBase}/search?q=3531422`;

  it('should add a property to the query string', () => {
    const result = getNewUrl({ cardId: 'baz' }, url, urlBase);

    expect(result.toString()).toBe(`${url}&cardId=baz`);
  });

  it('should replace a property from the query string', () => {
    const result = getNewUrl({ cardId: 'baz' }, `${url}&cardId=foo`, urlBase);

    expect(result.toString()).toEqual(`${url}&cardId=baz`);
  });

  it('should remove a property from the query string', () => {
    const result = getNewUrl({ cardId: null }, `${url}&cardId=foo`, urlBase);

    expect(result.toString()).toEqual(url);
  });
});

describe('getSubdomainPath()', () => {
  it('should not modify the path that starts with /api', () => {
    const result = getSubdomainPath('/api', { domain: 'charmverse' });
    expect(result).toEqual('/api');
  });

  it('should not return the path with subdomain when on subdomain host', () => {
    const result = getSubdomainPath('/foo', { domain: 'charmverse' }, 'charmverse.charmverse.io');
    expect(result).toEqual('/foo');
  });

  it('should not return the path with subdomain when on custom domain host', () => {
    const result = getSubdomainPath('/foo', { domain: 'charmverse' }, 'charmverse.io');
    expect(result).toEqual('/foo');
  });

  it('should return the path with subdomain', () => {
    const result = getSubdomainPath('/foo', { domain: 'charmverse' });
    expect(result).toEqual('/charmverse/foo');
  });

  it('should return the path with subdomain even if the path includes or is the subdomain', () => {
    const result = getSubdomainPath('/charmverse', { domain: 'charmverse' });
    expect(result).toEqual('/charmverse/charmverse');
  });
});
