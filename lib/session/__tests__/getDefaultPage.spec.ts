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
    const lastPageView = {
      spaceId: 'spaceId'
    };
    const url = getDefaultPage({
      lastPageView,
      spaces: [
        { id: 'brooklyn', domain: 'brooklyn' },
        { id: lastPageView.spaceId, domain: 'charmverse' }
      ]
    });
    expect(url).toEqual('/charmverse');
  });

  it('should use the first space available', () => {
    const url = getDefaultPage({
      spaces: [
        { id: 'charmverse', domain: 'charmverse' },
        { id: 'brooklyn', domain: 'brooklyn' }
      ]
    });
    expect(url).toEqual('/charmverse');
  });
});
