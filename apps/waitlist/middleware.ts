import { getSession } from '@connect-shared/lib/session/getSession';
import { isTruthy } from '@root/lib/utils/types';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const session = await getSession();
  const user = session.user;
  const path = request.nextUrl.pathname;

  // Make all pages private
  if (!user && path !== '/') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (user && path === '/') {
    return NextResponse.redirect(new URL('/profile', request.url));
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
    '/((?!api|_next/static|_next/image|images|favicon.ico|robots.txt|__ENV.js|manifest.webmanifest).*)'
  ]
};
