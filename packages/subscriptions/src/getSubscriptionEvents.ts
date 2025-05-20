import type { SpaceSubscriptionTier } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export type SubscriptionPaymentEvent = {
  type: 'payment';
  id: string;
  paidTokenAmount: string;
  createdAt: Date;
  tier: SpaceSubscriptionTier;
};

export type SubscriptionContributionEvent = {
  type: 'contribution';
  id: string;
  paidTokenAmount: string;
  createdAt: Date;
  userId: string | null;
};

export type SubscriptionTierChangeEvent = {
  type: 'tier-change';
  id: string;
  createdAt: Date;
  tier: SpaceSubscriptionTier;
  userId: string | null;
  previousTier: SpaceSubscriptionTier;
};

export type SubscriptionEvent = SubscriptionPaymentEvent | SubscriptionContributionEvent | SubscriptionTierChangeEvent;

export async function getSubscriptionEvents(spaceId: string): Promise<SubscriptionEvent[]> {
  const [subscriptionPaymentEvents, subscriptionContributionEvents, subscriptionTierChangeEvents] = await Promise.all([
    prisma.spaceSubscriptionPayment.findMany({
      where: { spaceId },
      select: {
        id: true,
        paidTokenAmount: true,
        createdAt: true,
        subscriptionTier: true
      }
    }),
    prisma.spaceSubscriptionContribution.findMany({
      where: { spaceId },
      select: {
        id: true,
        txHash: true,
        devTokenAmount: true,
        createdAt: true,
        userId: true,
        walletAddress: true
      }
    }),
    prisma.spaceSubscriptionTierChangeEvent.findMany({
      where: { spaceId },
      select: {
        id: true,
        createdAt: true,
        newTier: true,
        previousTier: true,
        userId: true
      }
    })
  ]);

  const subscriptionEvents = [
    ...subscriptionContributionEvents.map((contribution) => ({
      id: contribution.id,
      txHash: contribution.txHash!,
      paidTokenAmount: contribution.devTokenAmount,
      createdAt: contribution.createdAt,
      userId: contribution.userId,
      walletAddress: contribution.walletAddress,
      type: 'contribution' as const
    })),
    ...subscriptionPaymentEvents.map((payment) => ({
      id: payment.id,
      paidTokenAmount: payment.paidTokenAmount,
      createdAt: payment.createdAt,
      type: 'payment' as const,
      tier: payment.subscriptionTier
    })),
    ...subscriptionTierChangeEvents.map((tierChange) => ({
      id: tierChange.id,
      createdAt: tierChange.createdAt,
      type: 'tier-change' as const,
      tier: tierChange.newTier,
      userId: tierChange.userId,
      previousTier: tierChange.previousTier
    }))
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return subscriptionEvents;
}
