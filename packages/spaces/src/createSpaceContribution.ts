import { prisma } from '@charmverse/core/prisma-client';
import { base } from 'viem/chains';

export type CreateSpaceContributionRequest = {
  hash: string;
  walletAddress: string;
  paidTokenAmount: string;
  signature: string;
  message: string;
};

export async function createSpaceContribution(
  payload: CreateSpaceContributionRequest & {
    spaceId: string;
    userId: string;
  }
) {
  const { hash, walletAddress, paidTokenAmount, userId, spaceId } = payload;

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
