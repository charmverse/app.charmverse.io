import type { Scout } from '@charmverse/core/prisma-client';
import { deterministicV4UUIDFromFid } from '@connect-shared/lib/farcaster/uuidFromFid';
import { getFarcasterProfileById } from '@root/lib/farcaster/getFarcasterProfile';

import { findOrCreateUser } from 'lib/users/findOrCreateUser';

export async function findOrCreateFarcasterUser({ fid }: { fid: number }): Promise<Scout> {
  const profile = await getFarcasterProfileById(fid);
  if (!profile) {
    throw new Error('Could not find Farcaster profile');
  }
  return findOrCreateUser({
    // This ensures the id is aligned with ids from the connect waitlist
    newUserId: deterministicV4UUIDFromFid(fid),
    farcasterId: fid,
    avatar: profile.body.avatarUrl,
    bio: profile.body.bio,
    walletAddress: profile.connectedAddress,
    displayName: profile.body.displayName || profile.body.username,
    username: profile.body.username
  });
}
