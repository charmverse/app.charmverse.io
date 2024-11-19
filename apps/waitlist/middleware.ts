import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/frame')) {
    return NextResponse.redirect(
      new URL(`https://scoutgame.xyz/${request.nextUrl.pathname}${request.nextUrl.search}`),
      302
    );
  }

  return NextResponse.redirect(new URL('https://scoutgame.xyz'));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|images|favicon.ico|robots.txt|__ENV.js|manifest.webmanifest).*)']
};
