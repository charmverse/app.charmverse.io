import { NextResponse, NextRequest } from 'next/server';

import { middleware } from '../../middleware';

describe('Middleware', () => {
  const redirectSpy = jest.spyOn(NextResponse, 'redirect');
  const rewriteSpy = jest.spyOn(NextResponse, 'rewrite');

  afterEach(() => {
    redirectSpy.mockReset();
    rewriteSpy.mockReset();
  });

  it('should add custom domain into path', async () => {
    const host = 'work.charmverse.fyi';
    const req = new NextRequest(new Request(`https://${host}/page-url`), {});
    req.headers.set('host', host);

    const res = middleware(req);

    expect(rewriteSpy).toHaveBeenCalledTimes(1);
    expect(res?.headers.get('x-middleware-rewrite')).toBe(`https://${host}/${host}/page-url`);
  });

  it('should not redirect for CharmVerse static pages', async () => {
    const host = 'work.charmverse.fyi';
    const req = new NextRequest(new Request(`https://${host}/login`), {});
    req.headers.set('host', host);

    const res = middleware(req);
    expect(res).toBeUndefined();
    expect(rewriteSpy).toHaveBeenCalledTimes(0);
    expect(redirectSpy).toHaveBeenCalledTimes(0);
  });
});
