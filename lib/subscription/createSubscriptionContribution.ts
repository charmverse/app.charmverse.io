import type { SpaceSubscriptionTier } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export type CreateSubscriptionContributionRequest = {
  walletAddress: string;
  transactionInfo: {
    sourceChainId: number;
    sourceChainTxHash: string;
    decentPayload?: any;
  };
  tier?: SpaceSubscriptionTier;
  paidTokenAmount: string;
};

export async function createSubscriptionContribution(
  payload: CreateSubscriptionContributionRequest & {
    spaceId: string;
    userId: string;
  }
) {
  if (payload.tier) {
    // Need to check if the space has enough balance to change the tier
    await prisma.space.update({
      where: {
        id: payload.spaceId
      },
      data: {
        subscriptionTier: payload.tier
      }
    });
  }

  const contribution = await prisma.spaceSubscriptionContribution.create({
    data: {
      paidTokenAmount: payload.paidTokenAmount,
      spaceId: payload.spaceId,
      walletAddress: payload.walletAddress,
      userId: payload.userId,
      decentStatus: 'pending',
      decentChainId: payload.transactionInfo.sourceChainId,
      decentTxHash: payload.transactionInfo.sourceChainTxHash,
      decentPayload: payload.transactionInfo.decentPayload
    }
  });

  return contribution;
}
