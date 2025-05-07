import { getDefaultPage } from '../getDefaultPage';

describe('getDefaultPage()', () => {
  it('should send user to create a space', () => {
    const url = getDefaultPage({ spaces: [] });
    expect(url).toEqual('/createSpace');
  });

  it('should send user to redirect url', () => {
    const returnUrl = '/charmverse/getting-started';
    const url = getDefaultPage({ returnUrl, spaces: [] });
    expect(url).toEqual(returnUrl);
  });

  it('should use the space of the last page view', () => {
    const url = getDefaultPage({
      lastViewedSpaceId: 'spaceId',
      spaces: [
        { id: 'brooklyn', domain: 'brooklyn', customDomain: null },
        { id: 'spaceId', domain: 'charmverse', customDomain: null }
      ]
    });
    expect(url).toEqual('/charmverse');
  });

  it('should use the first space available', () => {
    const url = getDefaultPage({
      spaces: [
        { id: 'charmverse', domain: 'charmverse', customDomain: null },
        { id: 'brooklyn', domain: 'brooklyn', customDomain: null }
      ]
    });
    expect(url).toEqual('/charmverse');
  });
});
