import type { ConnectWaitlistSlot } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export async function getWaitlistSlotWithClicks({
  fid
}: {
  fid: number;
}): Promise<ConnectWaitlistSlot & { clicks: number }> {
  const slot = await prisma.connectWaitlistSlot.findUniqueOrThrow({
    where: {
      fid
    }
  });

  let clicks = await prisma.connectWaitlistSlot.count({
    where: {
      referredByFid: fid
    }
  });

  if (slot.githubLogin) {
    // Give 10 extra clicks when user has registered as a builder
    clicks += 10;
  }

  return {
    ...slot,
    clicks
  };
}
