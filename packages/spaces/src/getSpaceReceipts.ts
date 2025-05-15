import { prisma } from '@charmverse/core/prisma-client';

type SpacePaymentReceipt = {
  type: 'payment';
  id: string;
  paidTokenAmount: string;
  createdAt: Date;
};

type SpaceContributionReceipt = {
  type: 'contribution';
  id: string;
  txHash: string;
  paidTokenAmount: string;
  createdAt: Date;
  userId: string | null;
  walletAddress?: string;
};

export type SpaceReceipt = SpacePaymentReceipt | SpaceContributionReceipt;

export async function getSpaceReceipts(spaceId: string): Promise<SpaceReceipt[]> {
  const spacePayments = await prisma.spaceSubscriptionPayment.findMany({
    where: { spaceId },
    select: {
      id: true,
      paidTokenAmount: true,
      createdAt: true
    }
  });

  const spaceContributions = await prisma.spaceSubscriptionContribution.findMany({
    where: { spaceId, txHash: { not: null } },
    select: {
      id: true,
      txHash: true,
      devTokenAmount: true,
      createdAt: true,
      userId: true,
      walletAddress: true
    }
  });

  return [
    ...spaceContributions.map((contribution) => ({
      id: contribution.id,
      txHash: contribution.txHash!,
      paidTokenAmount: contribution.devTokenAmount,
      createdAt: contribution.createdAt,
      userId: contribution.userId,
      walletAddress: contribution.walletAddress,
      type: 'contribution' as const
    })),
    ...spacePayments.map((payment) => ({
      id: payment.id,
      paidTokenAmount: payment.paidTokenAmount,
      createdAt: payment.createdAt,
      type: 'payment' as const
    }))
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
