import { GET } from '@charmverse/core/http';
import { log } from '@charmverse/core/log';
import { sleep } from '@decent.xyz/box-common';

type DecentTransactionStatus = {
  transaction: {
    srcTx: {
      blockHash: string;
      blockNumber: number;
      accessList: any[];
      transactionIndex: number;
      type: string;
      nonce: number;
      input: string;
      r: string;
      s: string;
      chainId: number;
      v: string;
      gas: string;
      maxPriorityFeePerGas: string;
      from: string;
      to: string;
      maxFeePerGas: string;
      value: string;
      gasPrice: string;
      typeHex: string;
      transactionHash: string;
      success: boolean;
      blockExplorer: string;
      decodedInput: {
        functionName: string;
        args: (
          | {
              preBridge: {
                swapperId: number;
                swapPayload: string;
              };
              postBridge: {
                swapperId: number;
                swapPayload: string;
              };
              bridgeId: number;
              dstChainId: string;
              target: string;
              paymentOperator: string;
              refund: string;
              payload: string;
              additionalArgs: string;
            }
          | {
              appId: string;
              affiliateId: string;
              bridgeFee: string;
              appFees: any[];
            }
          | string
        )[];
      };
      org: {
        appId: string;
        affiliateId: string;
        appFees: any[];
      };
      method: string;
      usdValue: number;
      paymentToken: {
        src: {
          name: string;
          symbol: string;
          decimals: number;
          swap: boolean;
          amount: string;
        };
        dst: {
          name: string;
          symbol: string;
          decimals: number;
          swap: boolean;
          amount: string;
        };
      };
      timestamp: number;
    };
    bridgeTx: {
      fast: {
        srcUaAddress: string;
        dstUaAddress: string;
        updated: number;
        created: number;
        srcChainId: number;
        dstChainId: number;
        dstTxHash: string;
        srcTxHash: string;
        srcBlockHash: string;
        srcBlockNumber: string;
        srcUaNonce: number;
        status: string;
      };
      canonical: null;
      multiHop: boolean;
      success: boolean;
    };
    dstTx: {
      fast: {
        transactionHash: string;
        blockHash: string;
        blockNumber: number;
        l1BlobBaseFeeScalar: string;
        logsBloom: string;
        l1GasUsed: string;
        l1Fee: string;
        contractAddress: null;
        transactionIndex: number;
        l1GasPrice: string;
        l1BaseFeeScalar: string;
        type: string;
        l1BlobBaseFee: string;
        gasUsed: string;
        cumulativeGasUsed: string;
        from: string;
        to: string;
        effectiveGasPrice: string;
        status: string;
        chainId: number;
        blockExplorer: string;
        timestamp: number;
      };
      canonical: null;
      success: boolean;
    };
  };
  status: string;
};

type DecentTransactionToQuery = {
  sourceTxHash: string;
  sourceTxHashChainId: number;
};

export async function getTransactionStatusFromDecent({
  sourceTxHash,
  sourceTxHashChainId
}: DecentTransactionToQuery): Promise<DecentTransactionStatus> {
  const response = await GET<DecentTransactionStatus>(
    `https://api.decentscan.xyz/getStatus?sourceTxHash=${sourceTxHash}&sourceTxHashChainId=${sourceTxHashChainId}`,
    undefined,
    {
      headers: {
        'x-api-key': process.env.REACT_APP_DECENT_API_KEY
      }
    }
  );

  return response;
}

export async function waitForDecentTransactionSettlement({
  sourceTxHash,
  sourceTxHashChainId
}: DecentTransactionToQuery): Promise<string> {
  const startTime = Date.now();
  const maxWaitTime = 50000; // 50 seconds

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const response = await getTransactionStatusFromDecent({ sourceTxHash, sourceTxHashChainId });

      if (response.transaction?.dstTx?.success === true) {
        return response.transaction.dstTx.fast.transactionHash;
      }

      // Optional: Add a small delay before retrying
      log.debug('No success found try again', { sourceTxHash, sourceTxHashChainId, response });
      await sleep(5000);
    } catch (error) {
      log.error('Failed to fetch transaction status:', { sourceTxHash, sourceTxHashChainId, error });
    }
  }

  throw new Error(
    `Transaction status could not be confirmed within 45 seconds for sourceTxHash: ${sourceTxHash} on sourceTxHashChainId: ${sourceTxHashChainId}`
  );
}
