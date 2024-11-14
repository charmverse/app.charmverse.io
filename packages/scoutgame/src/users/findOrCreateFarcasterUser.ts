import { getFarcasterUserById } from '@packages/farcaster/getFarcasterUserById';
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
  const profile = await getFarcasterUserById(fid);
  if (!profile) {
    throw new Error('Could not find Farcaster profile');
  }
  return findOrCreateUser({
    newUserId: uuidFromNumber(fid),
    farcasterId: fid,
    avatar: profile.pfp_url,
    bio: profile.profile.bio.text,
    walletAddresses: profile.verifications,
    displayName: profile.display_name,
    path: profile.username,
    tierOverride,
    farcasterName: profile.username
  });
}
