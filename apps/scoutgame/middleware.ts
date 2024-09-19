import { getSession } from '@connect-shared/lib/session/getSession';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const privateLinks = ['/profile', '/notifications'];

export async function middleware(request: NextRequest) {
  const session = await getSession();
  const user = session.user;
  const path = request.nextUrl.pathname;

  // We don't have a '/' page anymore since we need to handle 2 different layouts
  if (path === '/') {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Redirect to login if anonymous user clicks on private links
  if (!user && privateLinks.some((url) => path.startsWith(url))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // In case we have the need to redirect to homepage
  if (!user && path.startsWith('/example-page')) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return NextResponse.next();
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
