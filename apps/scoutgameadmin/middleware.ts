import { getSession } from '@connect-shared/lib/session/getSession';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const session = await getSession<{ adminId?: string }>();
  const isLoggedIn = !!session.adminId;
  const path = request.nextUrl.pathname;

  if (!isLoggedIn && !path.startsWith('/login')) {
    // eslint-disable-next-line no-console
    console.log(`Redirect user to login from ${path}`);
    return NextResponse.redirect(new URL('/login', request.url));
  } else if (isLoggedIn && path === '/login') {
    // eslint-disable-next-line no-console
    console.log('Redirecting from login to home page', session);
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // We don't have a '/' page anymore since we need to handle 2 different layouts
  if (path === '/') {
    return NextResponse.redirect(new URL('/repos', request.url));
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
    '/((?!api|_next/static|_next/image|images|favicon.ico|robots.txt|__ENV.js|manifest.webmanifest|nft-assets).*)'
  ]
};
