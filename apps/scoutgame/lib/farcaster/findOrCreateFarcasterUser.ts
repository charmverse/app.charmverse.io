import type { Scout } from '@charmverse/core/prisma-client';
import { getFarcasterProfileById } from '@root/lib/farcaster/getFarcasterProfile';

import { findOrCreateUser } from 'lib/users/findOrCreateUser';

export async function findOrCreateFarcasterUser({
  fid,
  newUserId
}: {
  fid: number;
  newUserId?: string;
}): Promise<Scout> {
  const profile = await getFarcasterProfileById(fid);
  if (!profile) {
    throw new Error('Could not find Farcaster profile');
  }
  return findOrCreateUser({
    newUserId,
    farcasterId: fid,
    avatar: profile.body.avatarUrl,
    bio: profile.body.bio,
    walletAddress: profile.connectedAddress,
    displayName: profile.body.displayName || profile.body.username,
    username: profile.body.username
  });
}
