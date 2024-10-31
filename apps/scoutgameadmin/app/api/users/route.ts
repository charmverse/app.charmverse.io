import { log } from '@charmverse/core/log';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createUser } from 'lib/users/createUser';
import { getUser } from 'lib/users/getUser';
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
  const params = await request.json();
  const user = await getUser(params);
  if (!user) {
    throw new Error(`User not found: ${params.searchString}`);
  }
  const newUser = await createUser(user);
  log.info('Created new user', { newUser });
  return NextResponse.json({ success: true });
}
