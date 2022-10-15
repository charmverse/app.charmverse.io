import { getNewUrl } from '../browser';

describe('getNewUrl()', () => {

  const baseUrl = 'https://google.com/search?q=3531422';

  it('should add a property to the query string', () => {
    const result = getNewUrl({ cardId: 'baz' }, baseUrl);

    expect(result.toString()).toBe(`${baseUrl}&cardId=baz`);
  });

  it('should replace a property from the query string', () => {
    const result = getNewUrl({ cardId: 'baz' }, `${baseUrl}&cardId=foo`);

    expect(result.toString()).toEqual(`${baseUrl}&cardId=baz`);
  });

  it('should remove a property from the query string', () => {
    const result = getNewUrl({ cardId: null }, `${baseUrl}&cardId=foo`);

    expect(result.toString()).toEqual(baseUrl);
  });

});
