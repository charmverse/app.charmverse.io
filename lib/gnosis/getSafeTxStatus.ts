import { log } from '@charmverse/core/log';
import { ApplicationStatus } from '@charmverse/core/prisma';
import { AlchemyProvider } from '@ethersproject/providers';
import { BigNumber } from 'ethers';

import { getGnosisService } from 'lib/gnosis/gnosis';

export type SafeTxStatusDetails = {
  status: ApplicationStatus;
  chainTxHash?: string;
  safeTxHash: string;
};

export async function getSafeTxStatus({
  safeTxHash,
  chainId
}: {
  safeTxHash: string;
  chainId: number;
}): Promise<SafeTxStatusDetails | null> {
  const provider = new AlchemyProvider(chainId, process.env.ALCHEMY_API_KEY);
  const safeService = getGnosisService({ signer: provider, chainId });

  if (!safeService) {
    return null;
  }

  try {
    const safeTx = await safeService.getTransaction(safeTxHash);
    const hasValue = BigNumber.from(safeTx.value || '0').gt(0);
    const { isExecuted, isSuccessful, transactionHash: chainTxHash } = safeTx;

    if (isExecuted && isSuccessful) {
      // if safe tx was executed without value, it is considered as cancelled
      const status = hasValue ? ApplicationStatus.paid : ApplicationStatus.cancelled;

      return { status, chainTxHash, safeTxHash };
    }

    return { status: ApplicationStatus.processing, chainTxHash, safeTxHash };
  } catch (error) {
    log.warn('[safe] Failed to load tx', { error, safeTxHash, chainId });

    return null;
  }
}
