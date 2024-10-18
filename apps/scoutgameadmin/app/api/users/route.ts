import { log } from '@charmverse/core/log';
import { importReposByUser } from '@packages/scoutgame/importReposByUser';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { SortOrder, SortField } from 'lib/users/getUsers';
import { getUsers } from 'lib/users/getUsers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const searchString = searchParams.get('searchString');
  const sortOrder = searchParams.get('sortOrder') as SortOrder | undefined;
  const sortField = searchParams.get('sortField') as SortField | undefined;
  const repos = await getUsers({ searchString: searchString || undefined, sortOrder, sortField });
  return NextResponse.json(repos);
}

export async function POST(request: NextRequest) {
  const { owner } = await request.json();

  await importReposByUser(owner);

  return NextResponse.json({ success: true });
}
