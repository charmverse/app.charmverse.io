import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

const pointsPerReferral = 100;

export async function refreshUserScore({ fid }: { fid: number }): Promise<void> {
  const existingSlot = await prisma.connectWaitlistSlot.findUnique({
    where: {
      fid
    }
  });

  if (!existingSlot) {
    log.warn(`User with fid ${fid} not found in waitlist`);
    return;
  }

  const referrals = await prisma.connectWaitlistSlot.count({
    where: {
      referredByFid: fid
    }
  });

  await prisma.connectWaitlistSlot.update({
    where: {
      fid
    },
    data: {
      score: referrals * pointsPerReferral
    }
  });
}
