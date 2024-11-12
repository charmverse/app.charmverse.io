import type { Scout } from '@charmverse/core/prisma';

import { cacheGetUser, getUser } from './getUser';

export async function getUserFromSession(): Promise<SessionUser | null> {
  const session = await getSession();
  return getUser(session.scoutId);
}

export async function getCachedUserFromSession(): Promise<SessionUser | null> {
  const session = await getSession();
  const cached = cacheGetUser(session.scoutId);

  return cached;
}
