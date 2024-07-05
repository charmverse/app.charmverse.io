import { prisma } from '@charmverse/core/prisma-client';

import { getFarcasterUsers } from 'lib/farcaster/getFarcasterUsers';

export async function fetchUserByFarcasterUsername(username: string) {
  const [farcasterUser] = await getFarcasterUsers({
    username
  });

  if (!farcasterUser) {
    return null;
  }

  const user = await prisma.user.findFirstOrThrow({
    where: {
      farcasterUser: {
        fid: farcasterUser.fid
      }
    },
    select: {
      farcasterUser: true,
      id: true
    }
  });

  return user;
}
