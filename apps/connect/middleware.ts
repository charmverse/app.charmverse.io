import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { SessionData } from 'lib/session/config';
import { getIronOptions } from 'lib/session/getIronOptions';
import { isTruthy } from 'lib/utils/types';

export async function middleware(request: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), getIronOptions());
  const user = session.user;
  const path = request.nextUrl.pathname;

  // Make /p/ project pages public, /u/ user pages public
  const projectPathChunks = path.split('/').filter(isTruthy);
  const isEditProjectPath = projectPathChunks[0] === 'p' && projectPathChunks.at(-1) === 'edit';
  const isNewProjectPath = projectPathChunks[0] === 'p' && projectPathChunks.at(-1) === 'new';
  const isProjectPath = projectPathChunks[0] === 'p' && !isEditProjectPath && !isNewProjectPath;

  if (!user && path !== '/' && !isProjectPath && !path.startsWith('/u/')) {
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
     * - images (image files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|images|favicon.ico|robots.txt|__ENV.js|manifest.webmanifest).*)'
  ]
};
