import { getSession } from '@connect-shared/lib/session/getSession';
import { isTruthy } from '@root/lib/utils/types';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const session = await getSession();
  const user = session.user;
  const path = request.nextUrl.pathname;
  // Make /p/ project pages public, /u/ user pages public
  const projectPathChunks = path.split('/').filter(isTruthy);
  const isEditProjectPath = projectPathChunks[0] === 'p' && projectPathChunks.at(-1) === 'edit';
  const isNewProjectPath = projectPathChunks[0] === 'projects' && projectPathChunks.at(-1) === 'new';
  const isProjectPath = projectPathChunks[0] === 'p' && !isEditProjectPath;

  // Disallow project submissions and redirect to profile
  if (isNewProjectPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Projects are readonly due to the Sunny Awards submissions being suspended
  if (isEditProjectPath) {
    return NextResponse.redirect(new URL(`/p/${projectPathChunks[1]}`, request.url));
  }

  if (!user && path !== '/' && !isProjectPath && !path.startsWith('/u/')) {
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
