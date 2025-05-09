import { isExternalUrl } from '@packages/lib/utils/isExternalUrl';

describe('isExternalUrl', () => {
  it('should detect valid external url, when origin is not provided', () => {
    expect(isExternalUrl('https://cv.com')).toBe(true);
    expect(isExternalUrl('http://app.cv.io')).toBe(true);
    expect(isExternalUrl('file://somefile.xyz')).toBe(true);
  });

  it('should return false if url is only a path or invalid url', () => {
    expect(isExternalUrl('/charmverse/page')).toBe(false);
    expect(isExternalUrl('www.cv.com')).toBe(false);
    expect(isExternalUrl('app.charmverse.io')).toBe(false);
  });
});
