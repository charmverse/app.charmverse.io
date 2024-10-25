import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  return NextResponse.redirect(new URL('https://scoutgame.xyz'));
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|images|favicon.ico|robots.txt|__ENV.js|manifest.webmanifest).*)']
};
