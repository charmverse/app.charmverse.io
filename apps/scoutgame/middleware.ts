import { log } from '@charmverse/core/log';
import { getIronOptions } from '@connect-shared/lib/session/config';
import { getSession } from '@connect-shared/lib/session/getSession';
import { authSecret } from '@root/config/constants';
import { unsealData } from 'iron-session';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const privateLinks = ['/profile', '/notifications', '/welcome'];
export async function middleware(request: NextRequest) {
  const session = await getSession();
  let isLoggedIn = !!session.scoutId;
  const path = request.nextUrl.pathname;
  // console.log('request', request);
  const url = request.nextUrl.clone(); // Clone the request URL to modify it
  const sealedGithubUser = url.searchParams.get('github_user');
  const response = NextResponse.next(); // Create a response object to set cookies
  // console.log('sealedGithubUser', sealedGithubUser);
  if (sealedGithubUser) {
    const unsealed = await unsealData<{ scoutId: string }>(sealedGithubUser, {
      password: authSecret as string
    });

    const cookieName = process.env.AUTH_COOKIE || getIronOptions().cookieName;
    if (unsealed.scoutId) {
      // Set the cookie to the response
      response.cookies.set({
        name: cookieName,
        value: sealedGithubUser,
        httpOnly: true,
        secure: true,
        // 2 weeks
        maxAge: 1209600,
        path: '/'
      });

      isLoggedIn = true;

      // Mutate the request by adding the cookie to the headers
      request.headers.set('cookie', `${cookieName}=${sealedGithubUser}`);

      // Remove the `farcaster_user` param from the URL
      url.searchParams.delete('github_user');
      // eslint-disable-next-line no-console
      console.log('Logging in github user from Oauth callback', { userId: unsealed.scoutId });
      return NextResponse.redirect(url, { headers: response.headers });
    }
  }

  // We don't have a '/' page anymore since we need to handle 2 different layouts
  if (path === '/') {
    return NextResponse.redirect(new URL('/home', request.url));
  }
  // Redirect to login if anonymous user clicks on private links
  if (!isLoggedIn && privateLinks.some((link) => path.startsWith(link))) {
    // eslint-disable-next-line no-console
    console.log('Redirecting to login', session);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect to home if logged in user clicks on login
  if (isLoggedIn && path === '/login') {
    // eslint-disable-next-line no-console
    console.log('Redirecting to home page', session);
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return response;
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
    '/((?!api|_next/static|_next/image|images|favicon.ico|robots.txt|__ENV.js|manifest.webmanifest|sw.js).*)'
  ]
};
