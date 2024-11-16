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

  // User flow
  // lands on /, redirect to /welcome if logged in, otherwise stay on / (this should ideally never happen)
  // on /welcome, redirect to /quests if onboarded, otherwise stay on /welcome
  if (isLoggedIn && path === '/') {
    return NextResponse.redirect(new URL('/welcome', request.url));
  }

  if (!isLoggedIn && path !== '/') {
    return NextResponse.redirect(new URL('/', request.url));
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
