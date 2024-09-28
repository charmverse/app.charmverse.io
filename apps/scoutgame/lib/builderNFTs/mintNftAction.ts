'use server';

import { log } from '@charmverse/core/log';
import { PointsDirection, prisma } from '@charmverse/core/prisma-client';
import { sleep } from '@decent.xyz/box-common';
import { BuilderNFTSeasonOneClient } from '@packages/scoutgame/builderNfts/builderNFTSeasonOneClient';
import {
  builderContractAddress,
  builderNftChain,
  builderSmartContractOwnerKey
} from '@packages/scoutgame/builderNfts/constants';
import { refreshBuilderNftPrice } from '@packages/scoutgame/builderNfts/refreshBuilderNftPrice';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';
import { recordGameActivity } from '@packages/scoutgame/recordGameActivity';
import { GET } from '@root/adapters/http';
import { getWalletClient } from '@root/lib/blockchain/walletClient';
import { prettyPrint } from '@root/lib/utils/strings';
import { isAddress } from 'viem';
import * as yup from 'yup';

import { authActionClient } from 'lib/actions/actionClient';
import { getUserFromSession } from 'lib/session/getUserFromSession';

type TransactionStatus = {
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

async function getDestinationTransactionHash(txHash: string, chainId: number): Promise<string> {
  const startTime = Date.now();
  const maxWaitTime = 50000; // 50 seconds

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const response = await GET<TransactionStatus>(
        `https://api.decentscan.xyz/getStatus?txHash=${txHash}&chainId=${chainId}`,
        undefined,
        {
          headers: {
            'x-api-key': process.env.REACT_APP_DECENT_API_KEY
          }
        }
      );

      if (response.transaction?.dstTx?.success === true) {
        return response.transaction.dstTx.fast.transactionHash;
      }

      // Optional: Add a small delay before retrying
      log.debug('No success found try again', { txHash, chainId, response });
      await sleep(5000);
    } catch (error) {
      log.error('Failed to fetch transaction status:', { txHash, chainId, error });
    }
  }

  throw new Error(
    `Transaction status could not be confirmed within 45 seconds for txHash: ${txHash} on chainId: ${chainId}`
  );
}

export const mintNftAction = authActionClient
  .metadata({ actionName: 'mint-nft' })
  .schema(
    yup.object().shape({
      address: yup
        .string()
        .required()
        .test('Valid address', (v) => {
          if (!isAddress(v)) {
            return false;
          }
          return true;
        }),
      sourceTxChainId: yup.number().required(),
      tokenId: yup.string().required(),
      amount: yup.number().required(),
      builderId: yup.string().required(),
      txHash: yup.string().required()
    })
  )
  .action(async ({ ctx, parsedInput }) => {
    const userId = await getUserFromSession().then((u) => u?.id);

    if (!userId) {
      throw new Error('User not found');
    }

    const builderNft = await prisma.builderNft.findFirstOrThrow({
      where: {
        chainId: builderNftChain.id,
        contractAddress: builderContractAddress
      }
    });

    const serverClient = getWalletClient({ chainId: builderNftChain.id, privateKey: builderSmartContractOwnerKey });

    const apiClient = new BuilderNFTSeasonOneClient({
      chain: builderNftChain,
      contractAddress: builderContractAddress,
      walletClient: serverClient
    });

    const nextPrice = await apiClient.getTokenQuote({
      args: {
        tokenId: BigInt(parsedInput.tokenId),
        amount: BigInt(parsedInput.amount)
      }
    });

    const txHash = await getDestinationTransactionHash(parsedInput.txHash, parsedInput.sourceTxChainId);

    const txResult = await apiClient.mintTo({
      args: {
        account: parsedInput.address,
        tokenId: BigInt(parsedInput.tokenId),
        amount: BigInt(parsedInput.amount),
        scout: userId
      }
    });

    const nftEvent = await prisma.nFTPurchaseEvent.create({
      data: {
        // Assuming constant conversion rate of 4:1, and 6 decimals on USDC
        pointsValue: 0,
        tokensPurchased: parsedInput.amount,
        txHash: txResult.transactionHash,
        builderNftId: builderNft.id,
        scoutId: userId,
        builderEvent: {
          create: {
            type: 'nft_purchase',
            season: currentSeason,
            week: getCurrentWeek(),
            builder: {
              connect: {
                id: userId
              }
            }
          }
        }
      },
      include: {}
    });

    const pointsValue = Number(nextPrice) / 5;

    await refreshBuilderNftPrice({ builderId: parsedInput.builderId, season: currentSeason });

    await recordGameActivity({
      sourceEvent: {
        nftPurchaseEventId: nftEvent.id,
        onchainTxHash: txResult.transactionHash,
        onchainChainId: builderNftChain.id
      },
      activity: {
        pointsDirection: PointsDirection.out,
        userId,
        amount: parsedInput.amount
      }
    });

    await recordGameActivity({
      sourceEvent: {
        nftPurchaseEventId: nftEvent.id,
        onchainTxHash: txResult.transactionHash,
        onchainChainId: builderNftChain.id
      },
      activity: {
        pointsDirection: PointsDirection.in,
        userId: builderNft.builderId,
        amount: parsedInput.amount
      }
    });

    return { success: true };
  });
