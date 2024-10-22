import { Prisma, prisma } from "@charmverse/core/prisma-client";
import { ConnectWaitlistTier, getWaitlistRange } from "@packages/scoutgame/waitlist/scoring/constants";
import { welcomeFromWaitlistToScoutgame } from '@packages/scoutgame/waitlist/welcomeToScoutgame';


async function welcomeWaitlistTier(tier: ConnectWaitlistTier) {

  const tierInfo = getWaitlistRange(tier);

  const whereQuery: Prisma.ConnectWaitlistSlotWhereInput = tier === 'legendary' ? {
    percentile: {
      gte: tierInfo.min,
    }
  } : tier === 'common' ? {
    percentile: {
      lte: tierInfo.max
    }
  
  }
  // Other tiers have a minMax range
  : {
    percentile: {
      gte: tierInfo.min,
      lte: tierInfo.max
    }
  };

  const existingScouts = await prisma.scout.findMany({
    where: {
      farcasterId: {
        gte: 1
      }
    },
    select: {
      farcasterId: true
    }
  })

  // Only message users who are not already scouts
  const users = await prisma.connectWaitlistSlot.findMany({
    where: {...whereQuery, fid: {notIn: existingScouts.map(scout => scout.farcasterId).filter(Boolean) as number[]}},
    orderBy: {
      fid: 'asc'
    }
  });

  const totalUsersInTier = users.length;

  for (let i = 0; i < totalUsersInTier; i++) {
    const user = users[i];
    console.log(`Processing FID:${user.fid} user ${i + 1} of ${totalUsersInTier}`);
    await welcomeFromWaitlistToScoutgame({fid: user.fid});
  }

}