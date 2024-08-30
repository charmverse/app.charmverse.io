import type { ConnectWaitlistSlot } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

const pointsPerReferral = 100;

export async function refreshUserScore({ fid }: { fid: number }): Promise<ConnectWaitlistSlot> {
  const existingSlot = await prisma.connectWaitlistSlot.findUniqueOrThrow({
    where: {
      fid
    },
    select: {
      initialPosition: true
    }
  });

  const referrals = await prisma.connectWaitlistSlot.count({
    where: {
      referredByFid: fid
    }
  });

  return prisma.connectWaitlistSlot.update({
    where: {
      fid
    },
    data: {
      score: existingSlot.initialPosition - referrals * pointsPerReferral
    }
  });
}
