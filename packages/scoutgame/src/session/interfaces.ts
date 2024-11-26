import type { Scout } from '@charmverse/core/prisma-client';
import type { UTMParams } from '@packages/mixpanel/utils';

export type SessionData = {
  user?: { id: string };
  anonymousUserId?: string;
  utmParams?: UTMParams;
  scoutId?: string; // for ScoutGame, users in the scout database
};

export type SessionUser = Pick<
  Scout,
  | 'id'
  | 'path'
  | 'displayName'
  | 'avatar'
  | 'farcasterId'
  | 'farcasterName'
  | 'builderStatus'
  | 'currentBalance'
  | 'onboardedAt'
  | 'agreedToTermsAt'
  | 'bio'
  | 'referralCode'
>;
