import { ApplicationStatus } from '@charmverse/core/prisma';
import { getSafeApiClient } from '@packages/blockchain/getSafeApiClient';
import { log } from '@packages/core/log';
import type { SafeMultisigTransactionResponse } from '@safe-global/types-kit';

import { getAllMantleSafeTransactions, getMantleSafeTransaction } from './mantleClient';

export type SafeTxStatusDetails = {
  status: ApplicationStatus;
  chainTxHash: string | null;
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
      const safeTx = await getMantleSafeTransaction({
        chainId,
        safeTxHash
      });

      const safeAddress = safeTx.safeAddress;
      const { txStatus, txHash, txData, detailedExecutionInfo } = safeTx;

      if (txStatus === 'SUCCESS') {
        // 0 is for single safe payment, 1 is for multisig payment
        const status = (txData.operation === 0 ? BigInt(txData.value) > 0 : txData.operation === 1)
          ? ApplicationStatus.paid
          : ApplicationStatus.cancelled;

        return { status, chainTxHash: txHash, safeTxHash };
      } else if (txStatus === 'CANCELLED') {
        return { status: ApplicationStatus.cancelled, chainTxHash: txHash, safeTxHash };
      }

      const executedTxs = await getAllMantleSafeTransactions({ safeAddress, chainId, executed: true });
      // execution info is missing for cancelled txs
      const replacedTx = executedTxs.find((tx) => tx.transaction.executionInfo?.nonce === detailedExecutionInfo.nonce);

      if (replacedTx) {
        // transaction id format multisig_safeaddress_safetxhash
        const replacedSafeTxHash = replacedTx.transaction.id.split('_')[2];
        const replacedSafeTx = await getMantleSafeTransaction({
          chainId,
          safeTxHash: replacedSafeTxHash
        });

        const replacedChainTxHash = replacedSafeTx.txHash;
        return { status: ApplicationStatus.cancelled, chainTxHash: replacedChainTxHash, safeTxHash };
      }

      return { status: ApplicationStatus.processing, chainTxHash: txHash, safeTxHash };
    } else {
      const safeApiClient = await getSafeApiClient({ chainId });

      const safeTx = await safeApiClient.getTransaction(safeTxHash);

      const { isExecuted, isSuccessful, transactionHash: chainTxHash, nonce } = safeTx;

      if (isExecuted && isSuccessful) {
        // if safe tx was executed without value, it is considered as cancelled
        const status = hasValue(safeTx) ? ApplicationStatus.paid : ApplicationStatus.cancelled;

        return { status, chainTxHash, safeTxHash };
      }
      // check if tx was replaced with other tx with the same nonce
      const executedTxs = await safeApiClient.getAllTransactions(safeTx.safe, { executed: true } as any);
      const replacedTx = executedTxs.results.find((tx) => 'nonce' in tx && tx.nonce === nonce);

      // orginal tx was replaced with other tx
      if (replacedTx) {
        const replacedChainTxHash = 'transactionHash' in replacedTx ? replacedTx.transactionHash! : null;
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
  return BigInt(safeTx.value || '0') > 0 || !!safeTx.data;
}

// {
//   safeTx: {
//     safeAddress: '0x6B17CEe14a2973602F34812b25851572542A5da8',
//     txId: 'multisig_0x6B17CEe14a2973602F34812b25851572542A5da8_0xc80b4dbb88e762694e4a4ae6573e98ecf30690e8ebfc450192cceb51acb2c687',
//     executedAt: 1691150030000,
//     txStatus: 'SUCCESS',
//     txInfo: {
//       type: 'Custom',
//       to: [Object],
//       dataSize: '260',
//       value: '0',
//       methodName: null,
//       isCancellation: false
//     },
//     txData: {
//       hexData: '0x8d80ff0a000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000aa007290a4237d666c94566aec7f5c3c79bf0c2b58bf00000000000000000000000000000000000000000000000000b1a2bc2ec500000000000000000000000000000000000000000000000000000000000000000000007290a4237d666c94566aec7f5c3c79bf0c2b58bf00000000000000000000000000000000000000000000000000b1a2bc2ec50000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
//       dataDecoded: null,
//       to: [Object],
//       value: '0',
//       operation: 1,
//       trustedDelegateCallTarget: false
//     },
//     detailedExecutionInfo: {
//       type: 'MULTISIG',
//       submittedAt: 1691149975629,
//       nonce: 8,
//       safeTxGas: '0',
//       baseGas: '0',
//       gasPrice: '0',
//       gasToken: '0x0000000000000000000000000000000000000000',
//       refundReceiver: [Object],
//       safeTxHash: '0xc80b4dbb88e762694e4a4ae6573e98ecf30690e8ebfc450192cceb51acb2c687',
//       executor: [Object],
//       signers: [Array],
//       confirmationsRequired: 1,
//       confirmations: [Array],
//       trusted: true
//     },
//     txHash: '0xad1ecd504bcca87bbef5c830cfd59a491d0b9697ce8f094acbb62d86b71fc7d7'
//   },
//   txStatus: 'SUCCESS'
// }

// {
//   safeTx: {
//     safeAddress: '0x6B17CEe14a2973602F34812b25851572542A5da8',
//     txId: 'multisig_0x6B17CEe14a2973602F34812b25851572542A5da8_0xd6af01af873e6d122ff10287ec80dcf7ce89d5126e706b4b9232a0b9595a16e9',
//     executedAt: 1691148950000,
//     txStatus: 'SUCCESS',
//     txInfo: {
//       type: 'Transfer',
//       sender: [Object],
//       recipient: [Object],
//       direction: 'OUTGOING',
//       transferInfo: [Object]
//     },
//     txData: {
//       hexData: null,
//       dataDecoded: null,
//       to: [Object],
//       value: '50000000000000000',
//       operation: 0
//     },
//     detailedExecutionInfo: {
//       type: 'MULTISIG',
//       submittedAt: 1691148504712,
//       nonce: 7,
//       safeTxGas: '0',
//       baseGas: '0',
//       gasPrice: '0',
//       gasToken: '0x0000000000000000000000000000000000000000',
//       refundReceiver: [Object],
//       safeTxHash: '0xd6af01af873e6d122ff10287ec80dcf7ce89d5126e706b4b9232a0b9595a16e9',
//       executor: [Object],
//       signers: [Array],
//       confirmationsRequired: 1,
//       confirmations: [Array],
//       trusted: true
//     },
//     txHash: '0xefed51f68a26fc5b963d4333aad6f972987da6e8c730380bdc4c8506f00ff035'
//   },
//   txStatus: 'SUCCESS'
// }
