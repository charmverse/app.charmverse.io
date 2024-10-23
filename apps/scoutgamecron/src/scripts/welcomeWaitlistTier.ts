import { log } from "@charmverse/core/log";
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
    where: {...whereQuery, fid: {notIn: existingScouts.map(scout => scout.farcasterId).filter(Boolean) as number[]}, isPartnerAccount: {not: true}},
    orderBy: {
      fid: 'asc'
    },
    skip: 0
  });

  const totalUsersInTier = users.length;

  log.info(`Processing ${totalUsersInTier} users in tier ${tier}`);


 // const limit = totalUsersInTier;
   const limit = 1;

  for (let i = 0; i < limit; i++) {
    const user = users[i];
    console.log(`Processing FID:${user.fid} ${user.username} user ${i + 1} of ${totalUsersInTier}`);
    await welcomeFromWaitlistToScoutgame({fid: user.fid});
  }

}


welcomeWaitlistTier('common').then(console.log).catch(console.error);