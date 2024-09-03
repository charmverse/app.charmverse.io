import type { ConnectWaitlistSlot } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export function getWaitlistSlot({ fid }: { fid: number }): Promise<ConnectWaitlistSlot> {
  return prisma.connectWaitlistSlot.findUniqueOrThrow({
    where: {
      fid
    }
  });
}
