import type { Scout, ScoutWallet } from '@charmverse/core/prisma-client';
import { deterministicV4UUIDFromFid } from '@connect-shared/lib/farcaster/uuidFromFid';
import { getFarcasterUserById } from '@packages/farcaster/getFarcasterUserById';
import type { ConnectWaitlistTier } from '@packages/scoutgame/waitlist/scoring/constants';

import type { FindOrCreateUserResult } from 'lib/users/findOrCreateUser';
import { findOrCreateUser } from 'lib/users/findOrCreateUser';

export async function findOrCreateFarcasterUser({
  fid,
  tierOverride
}: {
  fid: number;
  tierOverride?: ConnectWaitlistTier;
}): Promise<FindOrCreateUserResult> {
  const profile = await getFarcasterUserById(fid);
  if (!profile) {
    throw new Error('Could not find Farcaster profile');
  }
  return findOrCreateUser({
    // This ensures the id is aligned with ids from the connect waitlist
    newUserId: deterministicV4UUIDFromFid(fid),
    farcasterId: fid,
    avatar: profile.pfp_url,
    bio: profile.profile.bio.text,
    walletAddresses: profile.verifications,
    displayName: profile.display_name,
    path: profile.username,
    tierOverride,
    farcasterUsername: profile.username,
    farcasterName: profile.display_name
  });
}
