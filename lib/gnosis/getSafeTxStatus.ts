import { AlchemyProvider } from '@ethersproject/providers';
import { ApplicationStatus } from '@prisma/client';
import { BigNumber } from 'ethers';

import { getGnosisService } from 'lib/gnosis/gnosis';
import log from 'lib/log';

export async function getSafeTxStatus({
  txHash,
  chainId
}: {
  txHash: string;
  chainId: number;
}): Promise<ApplicationStatus | null> {
  const provider = new AlchemyProvider(chainId, process.env.ALCHEMY_API_KEY);
  const safeService = getGnosisService({ signer: provider, chainId });

  if (!safeService) {
    return null;
  }

  try {
    const safeTx = await safeService.getTransaction(txHash);
    const hasValue = BigNumber.from(safeTx.value || '0').gt(0);
    const { isExecuted, isSuccessful } = safeTx;

    if (isExecuted && isSuccessful) {
      // if safe tx was executed without value, it is considered as cancelled
      return hasValue ? ApplicationStatus.paid : ApplicationStatus.cancelled;
    }

    return ApplicationStatus.processing;
  } catch (error) {
    log.warn('[safe] Failed to load tx', { error, txHash, chainId });

    return null;
  }
}
