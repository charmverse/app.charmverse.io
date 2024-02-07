import { prisma } from '@charmverse/core/prisma-client';

export function setPageUpdatedAt({ proposalId, userId }: { proposalId: string; userId: string }) {
  return prisma.page.update({
    where: {
      proposalId
    },
    data: {
      updatedAt: new Date(),
      updatedBy: userId
    }
  });
}
