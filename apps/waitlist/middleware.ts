import { prisma } from '@charmverse/core/prisma-client';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getSession } from 'lib/session/getSession';

export async function middleware(request: NextRequest) {
  const session = await getSession();
  const farcasterUser = session.farcasterUser;
  const path = request.nextUrl.pathname;

  // Make all pages private
  if (!farcasterUser && path !== '/') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (farcasterUser && path === '/') {
    return NextResponse.redirect(new URL('/score', request.url));
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
