import type { SessionOptions } from 'iron-session';
import { NextResponse } from 'next/server';

import { getUserFromSession } from 'lib/session/getUserFromSession';

// This API Route is non-blocking and called on every page load. Use it to refresh things about the current user
export async function GET() {
  const user = await getUserFromSession();

  return NextResponse.json(user);
}
