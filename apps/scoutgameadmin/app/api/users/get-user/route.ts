import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getUser } from 'lib/users/getUser';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const searchString = searchParams.get('searchString');
  const repos = await getUser({ searchString: searchString || '' });
  return NextResponse.json(repos);
}
