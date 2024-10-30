import type { Scout } from '@charmverse/core/prisma';
import { getSession } from '@connect-shared/lib/session/getSession';

import { cacheGetUser, getUser } from './getUser';

export type SessionUser = Pick<
  Scout,
  | 'id'
  | 'path'
  | 'displayName'
  | 'avatar'
  | 'builderStatus'
  | 'currentBalance'
  | 'onboardedAt'
  | 'agreedToTermsAt'
  | 'bio'
>;

export async function getUserFromSession(): Promise<SessionUser | null> {
  const session = await getSession();
  return getUser(session.scoutId);
}

export async function getCachedUserFromSession(): Promise<SessionUser | null> {
  const session = await getSession();
  const cached = cacheGetUser(session.scoutId);

  return cached;
}
