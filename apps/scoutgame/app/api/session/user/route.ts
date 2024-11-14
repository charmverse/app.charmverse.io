import { getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
import { NextResponse } from 'next/server';

// This API Route is non-blocking and called on every page load. Use it to refresh things about the current user
export async function GET() {
  const user = await getUserFromSession();
  return NextResponse.json(user);
}
