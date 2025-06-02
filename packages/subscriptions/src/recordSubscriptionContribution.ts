import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { waitForDecentV4TransactionSettlement } from '@packages/blockchain/waitForDecentV4TransactionSettlement';
import { base } from 'viem/chains';

export type CreateSubscriptionContributionRequest = {
  hash: string;
  walletAddress: string;
  paidTokenAmount: string;
  decentPayload?: {
    to: string;
    data: string;
    value: string;
  };
  chainId?: number;
  decentChainId?: number;
};

export async function recordSubscriptionContribution(
  payload: CreateSubscriptionContributionRequest & {
    spaceId: string;
    userId: string;
  }
) {
  const { hash, walletAddress, paidTokenAmount, userId, spaceId, decentChainId, decentPayload } = payload;

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

  const spaceContributionInput: Prisma.SpaceSubscriptionContributionCreateInput = {
    chainId: base.id,
    walletAddress,
    devTokenAmount: paidTokenAmount,
    decentPayload: {},
    decentChainId,
    space: {
      connect: {
        id: spaceId
      }
    },
    user: {
      connect: {
        id: userId
      }
    }
  };

  if (decentPayload) {
    if (!decentChainId) {
      throw new Error('Decent chain ID is required');
    }

    spaceContributionInput.decentPayload = decentPayload;
    spaceContributionInput.decentTxHash = hash.toLowerCase() as `0x${string}`;

    const txHash = await waitForDecentV4TransactionSettlement({
      sourceTxHash: hash.toLowerCase() as `0x${string}`,
      sourceTxHashChainId: decentChainId
    });

    spaceContributionInput.txHash = txHash;
  }

  const spaceContribution = await prisma.spaceSubscriptionContribution.create({
    data: spaceContributionInput
  });

  return spaceContribution;
}
