import type { Scout } from '@charmverse/core/prisma-client';
import { deterministicV4UUIDFromFid } from '@connect-shared/lib/farcaster/uuidFromFid';
import { getFarcasterUserById } from '@packages/farcaster/getFarcasterUserById';

import { findOrCreateUser } from 'lib/users/findOrCreateUser';

export async function findOrCreateFarcasterUser({ fid }: { fid: number }): Promise<Scout> {
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
    walletAddress: profile.verifications[0],
    displayName: profile.display_name || profile.username,
    username: profile.username
  });
}
