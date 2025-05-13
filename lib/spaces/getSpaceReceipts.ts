import { prisma } from '@charmverse/core/prisma-client';

export type SpaceReceipt = {
  id: string;
  txHash: string;
  paidTokenAmount: string;
  createdAt: Date;
  walletAddress: string;
  userId: string;
};

export async function getSpaceReceipts(spaceId: string): Promise<SpaceReceipt[]> {
  const spaceContributions = await prisma.spaceSubscriptionContribution.findMany({
    where: { spaceId, txHash: { not: null }, userId: { not: null } },
    select: {
      id: true,
      txHash: true,
      paidTokenAmount: true,
      createdAt: true,
      walletAddress: true,
      userId: true
    }
  });

  return spaceContributions.map((contribution) => ({
    id: contribution.id,
    txHash: contribution.txHash!,
    paidTokenAmount: contribution.paidTokenAmount,
    createdAt: contribution.createdAt,
    walletAddress: contribution.walletAddress,
    userId: contribution.userId!
  }));
}
