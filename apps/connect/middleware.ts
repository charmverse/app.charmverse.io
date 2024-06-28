import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { SessionData } from 'lib/session/config';
import { getIronOptions } from 'lib/session/getIronOptions';

// @TODO Update projects to be public
export async function middleware(request: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), getIronOptions());
  const user = session.user;
  const path = request.nextUrl.pathname;

  if (!user && path !== '/') {
    return NextResponse.redirect(new URL('/', request.url));
  } else if (user && path === '/') {
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
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
};
