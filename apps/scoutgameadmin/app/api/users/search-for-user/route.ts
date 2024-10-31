import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { searchForUser } from 'lib/users/searchForUser';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const searchString = searchParams.get('searchString');
  const user = await searchForUser({ searchString: searchString || '' });
  return NextResponse.json(user);
}
