import { authSecret } from '@root/config/constants';
import { unsealData } from 'iron-session';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { SessionData } from 'lib/session/config';
import { cookieName } from 'lib/session/config';
import { getSession } from 'lib/session/getSession';

export async function middleware(request: NextRequest) {
  const session = await getSession();
  let farcasterUser = session.farcasterUser;

  const path = request.nextUrl.pathname;
  const params = request.nextUrl.searchParams;

  const sealedFarcasterUser = params.get('farcaster_user');

  const response = NextResponse.next(); // Create a response object to set cookies

  if (sealedFarcasterUser) {
    const unsealedFid = await unsealData<SessionData>(sealedFarcasterUser, {
      password: authSecret as string
    });

    if (unsealedFid.farcasterUser) {
      // Set the cookie to the response
      response.cookies.set({
        name: cookieName,
        value: sealedFarcasterUser,
        httpOnly: true,
        secure: true,
        maxAge: 31536000,
        path: '/'
      });

      farcasterUser = unsealedFid.farcasterUser;

      // Mutate the request by adding the cookie to the headers
      request.headers.set('cookie', `${cookieName}=${sealedFarcasterUser}`);
    }
  }

  const authenticatedPaths = ['/builders', '/score', '/join'];

  if (!farcasterUser && authenticatedPaths.some((p) => path.startsWith(p))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (farcasterUser && path === '/') {
    return NextResponse.redirect(new URL('/score', request.url));
  }

  // Rewrite the request to pass the mutated headers along with it
  return NextResponse.rewrite(request.nextUrl, { request, headers: response.headers });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|images|favicon.ico|robots.txt|__ENV.js|manifest.webmanifest).*)']
};
