import { GET } from '@charmverse/core/http';
import { log } from '@charmverse/core/log';

type DecentV4TransactionStatus = {
  found: boolean;
  tx: {
    statusMessage: string;
    srcTxHash: string;
    srcChainId: number;
    dstChainId: number;
    dstTxHash: string;
    srcTx: {
      txHash: string;
      chainId: number;
      toAddress: string;
      blockExplorer: string;
      gasProvided: string;
      gasUsed: string;
      value: string;
      input: string;
      revertReason: string | null;
      timestamp: number;
      paymentToken: unknown;
    };
    dstTx: {
      txHash: string;
      chainId: number;
      toAddress: string;
      blockExplorer: string;
      gasProvided: string;
      gasUsed: string;
      value: string;
      input: string;
      revertReason: string | null;
      timestamp: number;
      paymentToken: unknown;
    };
    sender: string;
    org: {
      appId: string;
      affiliateId: string;
      appFees: unknown[];
    };
    decentScanLink: string;
    usdValue: number;
    bridgeDetails: {
      isBridge: boolean;
      bridgeTime: number | null;
      txPath: unknown[];
    };
  };
};

type DecentTransactionToQuery = {
  sourceTxHash: string;
  sourceTxHashChainId: number;
  maxWaitTime?: number;
};

async function getTransactionStatusFromDecentV4({
  sourceTxHash,
  sourceTxHashChainId
}: DecentTransactionToQuery): Promise<DecentV4TransactionStatus> {
  if (!process.env.REACT_APP_DECENT_API_KEY) {
    throw new Error('REACT_APP_DECENT_API_KEY is not set');
  }

  return GET<DecentV4TransactionStatus>(
    'https://api.decentscan.xyz/getStatus',
    { txHash: sourceTxHash, chainId: sourceTxHashChainId },
    {
      headers: {
        'x-api-key': process.env.REACT_APP_DECENT_API_KEY
      }
    }
  );
}

export class DecentTxFailedPermanently extends Error {
  constructor() {
    super('Transaction Failed');
  }
}

class DecentTimeoutSettlementError extends Error {
  constructor(sourceTxHash: string, sourceTxHashChainId: number) {
    super(
      `Transaction status could not be confirmed within 45 seconds for sourceTxHash: ${sourceTxHash} on sourceTxHashChainId: ${sourceTxHashChainId}`
    );
  }
}

export async function waitForDecentV4TransactionSettlement({
  sourceTxHash,
  sourceTxHashChainId,
  maxWaitTime = 4 * 60000 // 4 minutes
}: DecentTransactionToQuery): Promise<string> {
  const startTime = Date.now();

  const normalisedTxHash = sourceTxHash.toLowerCase();

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const response = await getTransactionStatusFromDecentV4({
        sourceTxHash: normalisedTxHash,
        sourceTxHashChainId
      });

      log.debug('Decent transaction status response', { response });

      if (response?.tx?.statusMessage?.toLowerCase().match('fail')) {
        throw new DecentTxFailedPermanently();
      }

      if (response.tx?.statusMessage === 'success') {
        return response.tx.dstTx.txHash;
      }

      // Add a small delay before retrying
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 5000);
      });
    } catch (error) {
      log.error('Error fetching status from decent', { error, sourceTxHashChainId, sourceTxHash });
      throw error;
    }
  }

  throw new DecentTimeoutSettlementError(sourceTxHash, sourceTxHashChainId);
}
