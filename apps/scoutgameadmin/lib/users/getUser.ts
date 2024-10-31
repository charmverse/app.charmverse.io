import type { ConnectWaitlistSlot, Scout } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { FarcasterUser } from '@root/lib/farcaster/getFarcasterUsers';
import { getFarcasterUsers } from '@root/lib/farcaster/getFarcasterUsers';

import { getNumberFromString } from './getUsers';

export type SearchUserResult = {
  scout?: Scout & { githubLogin?: string };
  waitlistUser?: ConnectWaitlistSlot;
  farcasterUser?: FarcasterUser;
};

// find a single user, from scouts or waitlist record. Eventually this doesnt need to search waitlist
export async function getUser({ searchString }: { searchString: string }): Promise<SearchUserResult | null> {
  if (searchString.length < 2) {
    return null;
  }
  // assume farcaster id if search string is a number
  // look for scout, then waitlist, then farcaster for a profile
  const userFid = getNumberFromString(searchString);
  if (userFid) {
    const scout = await prisma.scout.findUnique({
      where: {
        farcasterId: userFid
      }
    });
    if (scout) {
      return { scout };
    }
    const waitlistUser = await prisma.connectWaitlistSlot.findUnique({
      where: {
        fid: userFid
      }
    });
    if (waitlistUser) {
      return { waitlistUser };
    }
    const farcasterUser = await getFarcasterUsers({ fids: [userFid] });
    if (farcasterUser[0]) {
      return { farcasterUser: farcasterUser[0] };
    }
  }
  // check for scout by path
  const user = await prisma.scout.findUnique({
    where: {
      path: searchString
    },
    include: {
      githubUser: true
    }
  });
  if (user) {
    return { scout: { ...user, githubLogin: user.githubUser[0]?.login } };
  }
  // check for waitlist by github login or farcaster username
  const waitlistUser = await prisma.connectWaitlistSlot.findFirst({
    where: {
      OR: [{ githubLogin: searchString }, { username: searchString }]
    }
  });
  if (waitlistUser) {
    return { waitlistUser };
  }
  const farcasterUsers = await getFarcasterUsers({ username: searchString });
  if (farcasterUsers[0]) {
    return { farcasterUser: farcasterUsers[0] };
  }

  return null;
}
