import { authSecret } from '@root/config/constants';
import { unsealData } from 'iron-session';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { SessionData } from 'lib/session/config';
import { getCookieName } from 'lib/session/config';
import { getSession } from 'lib/session/getSession';

export async function middleware(request: NextRequest) {
  const session = await getSession();
  let farcasterUser = session.farcasterUser;

  const url = request.nextUrl.clone(); // Clone the request URL to modify it
  const sealedFarcasterUser = url.searchParams.get('farcaster_user');
  const response = NextResponse.next(); // Create a response object to set cookies

  if (sealedFarcasterUser) {
    const unsealedFid = await unsealData<SessionData>(sealedFarcasterUser, {
      password: authSecret as string
    });

    if (unsealedFid.farcasterUser) {
      // Set the cookie to the response
      response.cookies.set({
        name: getCookieName(),
        value: sealedFarcasterUser,
        httpOnly: true,
        secure: true,
        maxAge: 31536000,
        path: '/'
      });

      farcasterUser = unsealedFid.farcasterUser;

      // Mutate the request by adding the cookie to the headers
      request.headers.set('cookie', `${getCookieName()}=${sealedFarcasterUser}`);

      // Remove the `farcaster_user` param from the URL
      url.searchParams.delete('farcaster_user');
    }
  }

  const authenticatedPaths = ['/builders', '/score', '/join'];

  if (!farcasterUser && authenticatedPaths.some((p) => url.pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (farcasterUser && url.pathname === '/') {
    return NextResponse.redirect(new URL('/score', request.url));
  }

  // Rewrite the request with the new URL (without the query param)
  return NextResponse.rewrite(url, { request, headers: response.headers });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|images|favicon.ico|robots.txt|__ENV.js|manifest.webmanifest).*)']
};
