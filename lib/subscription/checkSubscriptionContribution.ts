import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { base } from 'viem/chains';

import { waitForDecentV4TransactionSettlement } from '../decent/waitForDecentV4TransactionSettlement';

export async function checkSubscriptionContribution({ contributionId }: { contributionId: string }) {
  const contribution = await prisma.spaceSubscriptionContribution.findUnique({
    where: {
      id: contributionId
    }
  });

  if (!contribution) {
    throw new Error('Contribution not found');
  }

  if (contribution.decentStatus !== 'pending') {
    log.info('Contribution is not pending. Skipping processing', {
      contributionId,
      status: contribution.decentStatus
    });
    return;
  }

  if (!contribution.decentTxHash || !contribution.decentChainId) {
    log.info('Contribution has no decent tx hash or chain id. Skipping processing', {
      contributionId,
      contribution
    });
    return;
  }

  try {
    const txHash = await waitForDecentV4TransactionSettlement({
      sourceTxHash: contribution.decentTxHash.toLowerCase(),
      sourceTxHashChainId: contribution.decentChainId
    });

    log.info('Contribution transaction settled', {
      contributionId,
      sourceTxHash: contribution.decentTxHash,
      destinationTxHash: txHash
    });

    await prisma.spaceSubscriptionContribution.update({
      where: { id: contributionId },
      data: {
        decentStatus: 'success',
        txHash,
        chainId: base.id
      }
    });
  } catch (error) {
    await prisma.spaceSubscriptionContribution.update({
      where: { id: contributionId },
      data: {
        decentStatus: 'failed'
      }
    });

    log.error('Error waiting for contribution transaction settlement', {
      contributionId,
      error
    });

    throw error;
  }
}
