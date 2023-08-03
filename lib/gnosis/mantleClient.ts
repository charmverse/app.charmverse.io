import type { SafeTransactionData } from '@safe-global/safe-core-sdk-types';
import { utils } from 'ethers';

import * as http from 'adapters/http';

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

interface SafeTransaction {
  safeAddress: string;
  txId: string;
  executedAt: number;
  txStatus: 'SUCCESS' | 'FAILED' | 'AWAITING_EXECUTION';
  txInfo: {
    type: string;
    sender: {
      value: string;
    };
    recipient: {
      value: string;
    };
    direction: string;
    transferInfo: {
      type: string;
      value: string;
    };
  };
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

export function getSafesByOwner({
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

export function getSafeData({
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

export function proposeTransaction({
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
    `https://gateway.multisig.mantle.xyz/v1/chains/${chainId}/transactions/${utils.getAddress(safeAddress)}/propose`,
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

export function getTransaction({
  safeAddress,
  safeTxHash,
  chainId
}: {
  safeAddress: string;
  chainId: number;
  safeTxHash: string;
}) {
  return http.GET<SafeTransaction>(
    `https://gateway.multisig.mantle.xyz/v1/chains/${chainId}/transactions/multisig_${safeAddress}_${safeTxHash}`,
    undefined,
    {
      credentials: 'omit'
    }
  );
}

// export function getAllTransactions({}: {
//   safeAddress: string;
// }) {
//   const url = new URL(`${this.#txServiceBaseUrl}/v1/safes/${address}/all-transactions/`)

//   const trusted = options?.trusted?.toString() || 'true'
//   url.searchParams.set('trusted', trusted)

//   const queued = options?.queued?.toString() || 'true'
//   url.searchParams.set('queued', queued)

//   const executed = options?.executed?.toString() || 'false'
//   url.searchParams.set('executed', executed)

//   return sendRequest({
//     url: url.toString(),
//     method: HttpMethod.Get
//   })
// }
