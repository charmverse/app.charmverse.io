import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getRepos } from 'lib/repos/getRepos';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const searchString = searchParams.get('searchString');
  const repos = await getRepos({ searchString: searchString || undefined });
  return NextResponse.json(repos);
}
