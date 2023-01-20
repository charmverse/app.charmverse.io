import { extractIframeProps } from '../utils';

describe('CharmEditor iframe utils', () => {
  test('extractIframeProps() extracts data from Google forms embed code', () => {
    const src = 'https://docs.google.com/forms/d/e/1FAI...ltEQ/viewform?embedded=true';
    const sample = `<iframe src="${src}" width="640" height="2831" frameborder="0" marginheight="0" marginwidth="0">Loading…</iframe>`;
    expect(extractIframeProps(sample)).toEqual({ src, width: 640, height: 2831 });
  });

  test('extractIframeProps() extracts width and height, even with fancy quotes and pixel units', () => {
    const src = 'https://docs.google.com/forms';
    const sample = `<iframe src="${src}" width=“640px“ height="2831" frameborder="0" marginheight="0" marginwidth="0">Loading…</iframe>`;
    expect(extractIframeProps(sample)).toEqual({ src, width: 640, height: 2831 });
  });
});
