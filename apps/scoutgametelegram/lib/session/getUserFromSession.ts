import { getSession } from '@connect-shared/lib/session/getSession';

import { cacheGetUser, getUser } from './getUser';
import type { SessionUser } from './interfaces';

export async function getUserFromSession(): Promise<SessionUser | null> {
  const session = await getSession();
  return getUser(session.scoutId);
}

export async function getCachedUserFromSession(): Promise<SessionUser | null> {
  const session = await getSession();
  const cached = cacheGetUser(session.scoutId);

  return cached;
}
