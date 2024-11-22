import type { SessionOptions } from 'iron-session';

import { getSession } from './getSession';
import { cacheGetUser, getUser } from './getUser';
import type { SessionUser } from './interfaces';

export async function getUserFromSession(cookieOptions?: SessionOptions['cookieOptions']): Promise<SessionUser | null> {
  const session = await getSession(cookieOptions);
  return getUser(session.scoutId);
}

export async function getCachedUserFromSession(
  cookieOptions?: SessionOptions['cookieOptions']
): Promise<SessionUser | null> {
  const session = await getSession(cookieOptions);
  const cached = cacheGetUser(session.scoutId);

  return cached;
}
