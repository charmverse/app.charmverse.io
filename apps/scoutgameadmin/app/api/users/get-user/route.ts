import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getUser } from 'lib/users/getUser';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }
  const user = await getUser(userId);
  return NextResponse.json(user);
}
