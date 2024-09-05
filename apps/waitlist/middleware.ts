import { authSecret, cookieName } from '@root/config/constants';
import { unsealData } from 'iron-session';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { SessionData } from 'lib/session/config';
import { getSession } from 'lib/session/getSession';

export async function middleware(request: NextRequest) {
  const session = await getSession();
  let farcasterUser = session.farcasterUser;

  const path = request.nextUrl.pathname;

  const params = request.nextUrl.searchParams;

  const sealedFarcasterUser = params.get('farcaster_user');

  const headers = new Headers();

  if (sealedFarcasterUser) {
    const unsealedFid = await unsealData<SessionData>(sealedFarcasterUser, {
      password: authSecret as string
    });

    if (unsealedFid.farcasterUser) {
      await request.cookies.set(cookieName, sealedFarcasterUser);

      farcasterUser = { fid: unsealedFid.farcasterUser.fid, username: unsealedFid.farcasterUser.username };

      headers.append('Set-Cookie', `${cookieName}=${sealedFarcasterUser}; HttpOnly; Secure; Max-Age=31536000; Path=/`);
    }
  }

  const authenticatedPaths = ['/builders', '/score', '/join'];

  if (path.startsWith('/frame')) {
    return NextResponse.next();
  }

  // Make all pages private
  if (!farcasterUser && authenticatedPaths.some((p) => path.startsWith(p))) {
    return NextResponse.redirect(new URL('/', request.url), { headers });
  }

  if (farcasterUser && path === '/') {
    return NextResponse.redirect(new URL('/score', request.url), { headers });
  }
  return NextResponse.next({ headers });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - images (image files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|images|favicon.ico|robots.txt|__ENV.js|manifest.webmanifest).*)'
  ]
};
