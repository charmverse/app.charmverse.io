import type { SessionOptions } from 'iron-session';
import { NextResponse } from 'next/server';

import { getUserFromSession } from 'lib/session/getUserFromSession';

const baseUrl = 'https://403f-85-204-75-2.ngrok-free.app';

// This API Route is non-blocking and called on every page load. Use it to refresh things about the current user
export async function GET(req: Request, res: Response) {
  const cookieName = process.env.AUTH_COOKIE || '';
  const authSecret = process.env.AUTH_SECRET || '';

  const ironOptions: SessionOptions = {
    cookieName,
    password: authSecret,
    cookieOptions: {
      sameSite: 'none',
      domain: new URL(baseUrl).hostname,
      // secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
      secure: true
    }
  };

  const user = await getUserFromSession();

  return NextResponse.json(user);
}
