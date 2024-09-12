import { deterministicV4UUIDFromFid } from '@connect-shared/lib/farcaster/uuidFromFid';
import { authSecret } from '@root/config/constants';
import { unsealData } from 'iron-session';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { trackWaitlistMixpanelEvent } from 'lib/mixpanel/trackMixpanelEvent';
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
        // 2 weeks
        maxAge: 1209600,
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
    return NextResponse.redirect(new URL('/', url));
  }

  if (farcasterUser?.hasJoinedWaitlist && url.pathname === '/') {
    return NextResponse.redirect(new URL('/score', url));
  }

  if (farcasterUser && !farcasterUser.hasJoinedWaitlist && url.pathname === '/score') {
    return NextResponse.redirect(new URL('/', url));
  }

  if (sealedFarcasterUser) {
    // Rewrite the URL without patameter
    return NextResponse.redirect(url, { headers: response.headers });
  }

  trackWaitlistMixpanelEvent('page_view', {
    page: url.pathname,
    userId: session.farcasterUser?.fid ? deterministicV4UUIDFromFid(session.farcasterUser.fid) : ''
  });

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|images|favicon.ico|robots.txt|__ENV.js|manifest.webmanifest).*)']
};
