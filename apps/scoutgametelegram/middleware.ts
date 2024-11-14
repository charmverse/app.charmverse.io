import { cookies, headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getSession } from 'lib/session/getSession';

// Everything is private
const privateLinks: string[] = [];

export async function middleware(request: NextRequest) {
  const session = await getSession();
  const isLoggedIn = !!session.scoutId;
  const path = request.nextUrl.pathname;
  const response = NextResponse.next(); // Create a response object to set cookies

  if (isLoggedIn && (path === '/' || path === '/welcome')) {
    return NextResponse.redirect(new URL('/quests', request.url));
  }

  // We don't have a '/' page anymore since we need to handle 2 different layouts
  if (path === '/') {
    return NextResponse.redirect(new URL('/welcome', request.url));
  }

  if (!isLoggedIn && path !== '/welcome') {
    return NextResponse.redirect(new URL('/welcome', request.url));
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
    '/((?!api|_next/static|_next/image|images|favicon.ico|robots.txt|__ENV.js|manifest.webmanifest).*)'
  ]
};
