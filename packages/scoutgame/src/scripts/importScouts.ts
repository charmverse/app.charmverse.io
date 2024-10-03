import { prisma } from '@charmverse/core/prisma-client';

import { getFarcasterUserByIds } from '@packages/farcaster/getFarcasterUserById';

const FIDS = [2514];

const startingBalance = 50;

async function query() {
  const w = await prisma.scout.findMany({
    where: {
      farcasterId: {
        in: FIDS
      }
    }
  });
  const newUsers = FIDS.filter((fid) => !w.some((scout) => scout.farcasterId === fid));
  console.log('retrieved', newUsers);
  const users = await getFarcasterUserByIds(newUsers);
  for (const user of users) {
    const scout = await prisma.scout.findFirst({
      where: {
        farcasterId: user.fid
      }
    });
    if (scout) {
      console.log('scout already exists', scout.username);
      continue;
    }
    const newScout = await prisma.scout.create({
      data: {
        farcasterId: user.fid,
        username: user.username,
        displayName: user.display_name || user.username,
        avatar: user.pfp_url,
        bio: user.profile.bio.text,
        currentBalance: startingBalance
      }
    });
    console.log('created scout', newScout.username);
  }
}

query().catch((e) => console.error(e));
