import { log } from '@charmverse/core/log';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createBuilder } from 'lib/users/createBuilder';

export async function POST(request: NextRequest) {
  const params = await request.json();
  const newUser = await createBuilder(params);
  log.info('Approved new builder', { newUser });
  return NextResponse.json({ success: true });
}
