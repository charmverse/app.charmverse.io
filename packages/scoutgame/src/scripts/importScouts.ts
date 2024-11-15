import { prisma } from '@charmverse/core/prisma-client';
import { log } from '@charmverse/core/log';

import { getFarcasterUserByIds } from '@packages/farcaster/getFarcasterUserById';
import { randomString } from '@packages/utils/strings';

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
  log.info(`retrieved ${newUsers.length} new users`);
  const users = await getFarcasterUserByIds(newUsers);
  for (const user of users) {
    const scout = await prisma.scout.findFirst({
      where: {
        farcasterId: user.fid
      }
    });
    if (scout) {
      log.info(`scout already exists`, {
        path: scout.path,
        fid: user.fid,
        displayName: user.display_name
      });
      continue;
    }
    const newScout = await prisma.scout.create({
      data: {
        farcasterId: user.fid,
        path: user.username,
        referralCode: randomString(),
        displayName: user.display_name || user.username,
        avatar: user.pfp_url,
        bio: user.profile.bio.text,
        currentBalance: startingBalance
      }
    });
    log.info(`created scout ${newScout.path}`);
  }
}

query().catch((e) => console.error(e));
