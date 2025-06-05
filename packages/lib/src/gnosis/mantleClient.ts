import * as http from '@packages/adapters/http';
import type { SafeTransactionData } from '@safe-global/types-kit';
import { getAddress } from 'viem';
import { mantle, mantleTestnet } from 'viem/chains';

type MantleMultisigSafe = {
  address: {
    value: string;
  };
  chainId: string;
  nonce: number;
  threshold: number;
  owners: {
    value: string;
  }[];
  implementation: {
    value: string;
  };
  modules: null;
  fallbackHandler: {
    value: string;
  };
  guard: null;
  version: string;
  implementationVersionState: string;
  collectiblesTag: string;
  txQueuedTag: string;
  txHistoryTag: string;
  messagesTag: string;
};

interface SafeTransactionTransferInfo {
  type: 'Transfer';
  sender: {
    value: string;
  };
  recipient: {
    value: string;
  };
  direction: 'OUTGOING' | 'INCOMING';
  transferInfo: {
    type: 'NATIVE_COIN';
    value: string;
  };
}

interface SafeTransactionCustomInfo {
  type: 'Custom';
  to: {
    value: string;
  };
  dataSize: string;
  value: string;
  methodName: null;
  isCancellation: boolean;
}

interface SafeTransactionCreationInfo {
  type: 'Creation';
  creator: {
    value: string;
  };
  transactionHash: string;
  implementation: {
    value: string;
  };
  factory: {
    value: string;
  };
}

type SafeTransactionInfo = SafeTransactionTransferInfo | SafeTransactionCreationInfo | SafeTransactionCustomInfo;

interface SafeTransaction {
  safeAddress: string;
  txId: string;
  executedAt: number;
  txStatus: 'SUCCESS' | 'CANCELLED' | 'AWAITING_EXECUTION';
  txInfo: SafeTransactionInfo;
  txData: {
    hexData: null;
    dataDecoded: null;
    to: {
      value: string;
    };
    value: string;
    operation: number;
  };
  detailedExecutionInfo: {
    type: string;
    submittedAt: number;
    nonce: number;
    safeTxGas: string;
    baseGas: string;
    gasPrice: string;
    gasToken: string;
    refundReceiver: {
      value: string;
    };
    safeTxHash: string;
    executor: {
      value: string;
    };
    signers: {
      value: string;
    }[];
    confirmationsRequired: number;
    confirmations: {
      signer: {
        value: string;
      };
      signature: string;
      submittedAt: number;
    }[];
    trusted: boolean;
  };
  txHash: string;
}

interface LabelResult {
  type: 'LABEL';
  label: string;
}

interface DateLabelResult {
  timestamp: number;
  type: 'DATE_LABEL';
}

interface TransactionResult {
  type: 'TRANSACTION';
  transaction: {
    id: string;
    timestamp: number;
    txStatus: SafeTransaction['txStatus'];
    txInfo: SafeTransactionInfo;
    executionInfo?: {
      type: string;
      nonce: number;
      confirmationsRequired: number;
      confirmationsSubmitted: number;
    };
  };
  conflictType: 'None';
}

type GetTransactionsData = LabelResult | TransactionResult | DateLabelResult;

interface GetTransactionsApiResponse {
  next: null;
  previous: null;
  results: GetTransactionsData[];
}

export function getMantleSafesByOwner({
  serviceUrl,
  chainId,
  address
}: {
  serviceUrl: string;
  chainId: number;
  address: string;
}) {
  return http.GET<{ safes: string[] }>(`${serviceUrl}/v1/chains/${chainId}/owners/${address}/safes`, undefined, {
    credentials: 'omit'
  });
}

export function getMantleSafeData({
  serviceUrl,
  chainId,
  address
}: {
  serviceUrl: string;
  chainId: number;
  address: string;
}) {
  return http.GET<MantleMultisigSafe>(`${serviceUrl}/v1/chains/${chainId}/safes/${address}`, undefined, {
    credentials: 'omit'
  });
}

export function proposeMantleSafeTransaction({
  safeTransactionData,
  txHash,
  signature,
  safeAddress,
  senderAddress,
  chainId
}: {
  txHash: string;
  signature: string;
  senderAddress: string;
  safeAddress: string;
  safeTransactionData: SafeTransactionData;
  chainId: number;
}) {
  return http.POST(
    `https://gateway.multisig.mantle.xyz/v1/chains/${chainId}/transactions/${getAddress(safeAddress)}/propose`,
    {
      ...safeTransactionData,
      safeTxHash: txHash,
      sender: senderAddress,
      signature,
      origin
    },
    {
      credentials: 'omit'
    }
  );
}

export function getMantleSafeTransaction({ safeTxHash, chainId }: { chainId: number; safeTxHash: string }) {
  return http.GET<SafeTransaction>(
    // 1 indicates the safeAddress, it works for now but it's not ideal
    `https://gateway.multisig.mantle.xyz/v1/chains/${chainId}/transactions/multisig_1_${safeTxHash}`,
    undefined,
    {
      credentials: 'omit'
    }
  );
}

export async function getAllMantleSafeTransactions({
  safeAddress,
  chainId,
  executed
}: {
  chainId: number;
  safeAddress: string;
  executed?: boolean;
}) {
  const { results: getTransactionsQueuedResults } = await http.GET<GetTransactionsApiResponse>(
    `https://gateway.multisig.mantle.xyz/v1/chains/${chainId}/safes/${safeAddress}/transactions/queued`,
    undefined,
    {
      credentials: 'omit'
    }
  );

  const queuedTransactions = getTransactionsQueuedResults.filter(
    (result) => result.type === 'TRANSACTION'
  ) as TransactionResult[];

  const { results: getTransactionsHistoryResults } = await http.GET<GetTransactionsApiResponse>(
    `https://gateway.multisig.mantle.xyz/v1/chains/${chainId}/safes/${safeAddress}/transactions/history`,
    undefined,
    {
      credentials: 'omit'
    }
  );

  const executedTransactions = getTransactionsHistoryResults.filter(
    (result) => result.type === 'TRANSACTION'
  ) as TransactionResult[];

  if (!executed) {
    return queuedTransactions.filter((transaction) => transaction.transaction.txInfo.type === 'Transfer');
  }

  return [...queuedTransactions, ...executedTransactions].filter(
    (transaction) =>
      transaction.transaction.txStatus !== 'AWAITING_EXECUTION' && transaction.transaction.txInfo.type === 'Transfer'
  );
}
export function isMantleChain(chainId: number) {
  return chainId === mantle.id || chainId === mantleTestnet.id;
}
