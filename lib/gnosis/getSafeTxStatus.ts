import { log } from '@charmverse/core/log';
import { ApplicationStatus } from '@charmverse/core/prisma';
import { AlchemyProvider } from '@ethersproject/providers';
import type { SafeMultisigTransactionResponse } from '@safe-global/safe-core-sdk-types';
import { BigNumber } from 'ethers';

import { getGnosisService } from 'lib/gnosis/gnosis';

import { getAllTransactions, getTransaction } from './mantleClient';

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
  try {
    if (chainId === 5000 || chainId === 5001) {
      const safeTx = await getTransaction({
        chainId,
        safeTxHash
      });

      const safeAddress = safeTx.safeAddress;
      const { txStatus, txHash, txData, detailedExecutionInfo } = safeTx;

      if (txStatus === 'SUCCESS') {
        // if safe tx was executed without value, it is considered as cancelled
        const status = BigNumber.from(txData.value).gt(0) ? ApplicationStatus.paid : ApplicationStatus.cancelled;

        return { status, chainTxHash: txHash, safeTxHash };
      }

      const executedTxs = await getAllTransactions({ safeAddress, chainId, executed: true });
      // execution info is missing for cancelled txs
      const replacedTx = executedTxs.find((tx) => tx.transaction.executionInfo?.nonce === detailedExecutionInfo.nonce);

      if (replacedTx) {
        // transaction id format multisig_safeaddress_safetxhash
        const replacedSafeTxHash = replacedTx.transaction.id.split('_')[2];
        if (replacedSafeTxHash) {
          const replacedSafeTx = await getTransaction({
            chainId,
            safeTxHash: replacedSafeTxHash
          });

          if (replacedSafeTx) {
            const replacedChainTxHash = replacedSafeTx.txHash;
            return { status: ApplicationStatus.cancelled, chainTxHash: replacedChainTxHash, safeTxHash };
          }
        }
      }

      return { status: ApplicationStatus.processing, chainTxHash: txHash, safeTxHash };
    } else {
      const provider = new AlchemyProvider(chainId, process.env.ALCHEMY_API_KEY);
      const safeService = getGnosisService({ signer: provider, chainId });
      if (!safeService) {
        return null;
      }

      const safeTx = (await safeService.getTransaction(safeTxHash)) as SafeMultisigTransactionResponse;

      const { isExecuted, isSuccessful, transactionHash: chainTxHash, nonce } = safeTx;

      if (isExecuted && isSuccessful) {
        // if safe tx was executed without value, it is considered as cancelled
        const status = hasValue(safeTx) ? ApplicationStatus.paid : ApplicationStatus.cancelled;

        return { status, chainTxHash, safeTxHash };
      }
      // check if tx was replaced with other tx with the same nonce
      const executedTxs = await safeService.getAllTransactions(safeTx.safe, { executed: true });
      const replacedTx = executedTxs.results.find((tx) => 'nonce' in tx && tx.nonce === nonce);

      // orginal tx was replaced with other tx
      if (replacedTx) {
        const replacedChainTxHash = 'transactionHash' in replacedTx ? replacedTx.transactionHash : undefined;
        return { status: ApplicationStatus.cancelled, chainTxHash: replacedChainTxHash, safeTxHash };
      }

      return { status: ApplicationStatus.processing, chainTxHash, safeTxHash };
    }
  } catch (error) {
    log.warn('[safe] Failed to load tx', { error, safeTxHash, chainId });

    return null;
  }
}

function hasValue(safeTx: SafeMultisigTransactionResponse): boolean {
  return BigNumber.from(safeTx.value || '0').gt(0) || !!safeTx.data;
}
