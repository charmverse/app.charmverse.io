import type { ConnectWaitlistSlot } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

const pointsPerReferral = 100;

export async function refreshUserScore({ fid }: { fid: number }): Promise<ConnectWaitlistSlot> {
  const existingSlot = await prisma.connectWaitlistSlot.findUniqueOrThrow({
    where: {
      fid
    },
    select: {
      initialPosition: true,
      githubLogin: true
    }
  });

  let referrals = await prisma.connectWaitlistSlot.count({
    where: {
      referredByFid: fid
    }
  });

  // Github login earns you extra 10 clicks
  if (existingSlot.githubLogin) {
    referrals += 10;
  }

  return prisma.connectWaitlistSlot.update({
    where: {
      fid
    },
    data: {
      score: existingSlot.initialPosition - referrals * pointsPerReferral
    }
  });
}
