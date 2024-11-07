import type { Scout } from '@charmverse/core/prisma-client';

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
>;
