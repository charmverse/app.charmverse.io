import { prisma } from '@charmverse/core/prisma-client';
import { base } from 'viem/chains';

export type CreateSubscriptionContributionRequest = {
  hash: string;
  walletAddress: string;
  paidTokenAmount: string;
  decentPayload?: Record<string, unknown>;
  chainId?: number;
};

export async function recordSubscriptionContribution(
  payload: CreateSubscriptionContributionRequest & {
    spaceId: string;
    userId: string;
  }
) {
  const { hash, walletAddress, paidTokenAmount, userId, spaceId } = payload;

  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    select: {
      subscriptionCancelledAt: true
    }
  });

  if (space.subscriptionCancelledAt) {
    throw new Error('Space subscription cancelled');
  }

  const spaceContribution = await prisma.spaceSubscriptionContribution.create({
    data: {
      spaceId,
      walletAddress,
      devTokenAmount: paidTokenAmount,
      decentPayload: {},
      chainId: base.id,
      txHash: hash.toLowerCase() as `0x${string}`,
      userId
    }
  });

  return spaceContribution;
}
