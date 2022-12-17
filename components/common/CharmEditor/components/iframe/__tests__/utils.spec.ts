import { extractIframeUrl } from '../utils';

describe('CharmEditor iframe utils', () => {
  test('extractIframeUrl() extracts a URL from string', () => {
    const url = 'https://docs.google.com/forms/d/e/1FAI...ltEQ/viewform?embedded=true';
    const sample = `<iframe src="${url}" width="640" height="2831" frameborder="0" marginheight="0" marginwidth="0">Loading…</iframe>`;
    expect(extractIframeUrl(sample)).toBe(url);
  });
});
