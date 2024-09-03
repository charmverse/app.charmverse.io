import { prisma } from '@charmverse/core/prisma-client';

export async function getWaitlistSlot({ fid }: { fid: number }) {
  return prisma.connectWaitlistSlot.findUniqueOrThrow({
    where: {
      fid
    }
  });
}
