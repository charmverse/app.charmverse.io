import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getFarcasterUserById } from '@packages/farcaster/getFarcasterUserById';
import { generateRandomName } from '@packages/scoutgame/users/generateRandomName';
import { generateUserPath } from '@packages/scoutgame/users/generateUserPath';
import { uuidFromNumber } from '@packages/utils/uuid';

import type { ConnectWaitlistTier } from '../waitlist/scoring/constants';

import { findOrCreateUser } from './findOrCreateUser';
import type { FindOrCreateUserResult } from './findOrCreateUser';

export async function findOrCreateFarcasterUser({
  fid,
  tierOverride
}: {
  fid: number;
  tierOverride?: ConnectWaitlistTier;
}): Promise<FindOrCreateUserResult> {
  // check if user already exists to avoid api calls to neynar
  const existing = await prisma.scout.findUnique({
    where: { farcasterId: fid },
    select: {
      id: true,
      onboardedAt: true,
      agreedToTermsAt: true
    }
  });
  if (existing) {
    return { isNew: false, ...existing };
  }
  const profile = await getFarcasterUserById(fid).catch((error) => {
    log.error('Error fetching Farcaster profile', { fid, error });
    return null;
  });
  const displayName = profile?.display_name || generateRandomName();
  return findOrCreateUser({
    newUserId: uuidFromNumber(fid),
    farcasterId: fid,
    avatar: profile?.pfp_url,
    bio: profile?.profile?.bio?.text,
    walletAddresses: profile?.verifications,
    displayName: profile?.display_name || displayName,
    path: profile?.username || (await generateUserPath(displayName)),
    tierOverride,
    farcasterName: profile?.username
  });
}
