import type { Scout } from '@charmverse/core/prisma-client';

export type SessionData = {
  user?: { id: string };
  anonymousUserId?: string;
  scoutId?: string; // for ScoutGame, users in the scout database
};

export type SessionUser = Pick<
  Scout,
  | 'id'
  | 'path'
  | 'displayName'
  | 'avatar'
  | 'farcasterName'
  | 'builderStatus'
  | 'currentBalance'
  | 'onboardedAt'
  | 'agreedToTermsAt'
  | 'bio'
  | 'referralCode'
>;
