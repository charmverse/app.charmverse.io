import { getSession } from '@connect-shared/lib/session/getSession';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const privateLinks = ['/profile', '/notifications', '/welcome', '/claim'];
export async function middleware(request: NextRequest) {
  const session = await getSession();
  const isLoggedIn = !!session.scoutId;
  const path = request.nextUrl.pathname;
  const response = NextResponse.next(); // Create a response object to set cookies

  // We don't have a '/' page anymore since we need to handle 2 different layouts
  if (path === '/') {
    return NextResponse.redirect(new URL('/home', request.url));
  }
  // Redirect to login if anonymous user clicks on private links
  if (!isLoggedIn && privateLinks.some((link) => path.startsWith(link))) {
    // eslint-disable-next-line no-console
    console.log('Redirecting to login', { path, ...session });
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
