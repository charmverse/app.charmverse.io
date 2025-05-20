import type { SpaceSubscriptionTier } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

type SubscriptionPaymentReceipt = {
  type: 'payment';
  id: string;
  paidTokenAmount: string;
  createdAt: Date;
  tier: SpaceSubscriptionTier;
};

type SubscriptionContributionReceipt = {
  type: 'contribution';
  id: string;
  paidTokenAmount: string;
  createdAt: Date;
  userId: string | null;
};

export type SubscriptionReceipt = SubscriptionPaymentReceipt | SubscriptionContributionReceipt;

export async function getSubscriptionReceipts(spaceId: string): Promise<SubscriptionReceipt[]> {
  const subscriptionPayments = await prisma.spaceSubscriptionPayment.findMany({
    where: { spaceId },
    select: {
      id: true,
      paidTokenAmount: true,
      createdAt: true,
      subscriptionTier: true
    }
  });

  const subscriptionContributions = await prisma.spaceSubscriptionContribution.findMany({
    where: { spaceId },
    select: {
      id: true,
      devTokenAmount: true,
      createdAt: true,
      userId: true
    }
  });

  return [
    ...subscriptionContributions.map((contribution) => ({
      id: contribution.id,
      paidTokenAmount: contribution.devTokenAmount,
      createdAt: contribution.createdAt,
      userId: contribution.userId,
      type: 'contribution' as const
    })),
    ...subscriptionPayments.map((payment) => ({
      id: payment.id,
      paidTokenAmount: payment.paidTokenAmount,
      createdAt: payment.createdAt,
      type: 'payment' as const,
      tier: payment.subscriptionTier
    }))
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
