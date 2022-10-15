import { getUriWithParam } from '../browser';

describe('getUriWithParam()', () => {

  const baseUrl = 'https://google.com/search?q=3531422';

  it('should add a property to the query string', () => {
    const result = getUriWithParam(baseUrl, { cardId: 'baz' });

    expect(result).toBe(`${baseUrl}&cardId=baz`);
  });

  it('should replace a property from the query string', () => {
    const result = getUriWithParam(`${baseUrl}&cardId=foo`, { cardId: 'baz' });

    expect(result).toEqual(`${baseUrl}&cardId=baz`);
  });

  it('should remove a property from the query string', () => {
    const result = getUriWithParam(`${baseUrl}&cardId=foo`, { cardId: undefined });

    expect(result).toEqual(baseUrl);
  });

});
