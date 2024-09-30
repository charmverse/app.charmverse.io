'use server';

import { PointsDirection, prisma } from '@charmverse/core/prisma-client';
import { waitForDecentTransactionSettlement } from '@packages/onchain/waitForDecentTransactionSettlement';
import { builderNftChain } from '@packages/scoutgame/builderNfts/constants';
import { getScoutGameNftAdminWallet } from '@packages/scoutgame/builderNfts/getScoutGameNftAdminWallet';
import { refreshBuilderNftPrice } from '@packages/scoutgame/builderNfts/refreshBuilderNftPrice';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';
import { recordGameActivity } from '@packages/scoutgame/recordGameActivity';

import { getBuilderContractAdminClient } from './builderNfts/clients/builderContractAdminWriteClient';

export async function handlePendingTransaction({
  pendingTransactionId
}: {
  pendingTransactionId: string;
}): Promise<void> {
  const pendingTx = await prisma.pendingNftTransaction.findUniqueOrThrow({
    where: {
      id: pendingTransactionId
    }
  });

  const builderNft = await prisma.builderNft.findFirstOrThrow({
    where: {
      chainId: pendingTx.destinationChainId,
      contractAddress: pendingTx.contractAddress
    }
  });

  const serverClient = getScoutGameNftAdminWallet();

  const apiClient = getBuilderContractAdminClient();

  const txHash = await waitForDecentTransactionSettlement({
    sourceTxHash: pendingTx.sourceChainTxHash,
    sourceTxHashChainId: pendingTx.sourceChainId
  });

  const txResult = await apiClient.mintTo({
    args: {
      account: pendingTx.senderAddress,
      tokenId: pendingTx.tokenId,
      amount: pendingTx.targetAmountReceived,
      scout: pendingTx.userId
    }
  });

  const nftEvent = await prisma.nFTPurchaseEvent.create({
    data: {
      // Assuming constant conversion rate of 4:1, and 6 decimals on USDC
      pointsValue: 0,
      tokensPurchased: pendingTx.tokenAmount,
      txHash: txResult.transactionHash,
      builderNftId: builderNft.id,
      scoutId: pendingTx.userId,
      builderEvent: {
        create: {
          type: 'nft_purchase',
          season: currentSeason,
          week: getCurrentWeek(),
          builder: {
            connect: {
              id: pendingTx.userId
            }
          }
        }
      }
    },
    include: {}
  });

  // const pointsValue = Number(nextPrice) / 5;

  await refreshBuilderNftPrice({ builderId: builderNft.builderId, season: currentSeason });

  await recordGameActivity({
    sourceEvent: {
      nftPurchaseEventId: nftEvent.id,
      onchainTxHash: txResult.transactionHash,
      onchainChainId: builderNftChain.id
    },
    activity: {
      pointsDirection: PointsDirection.out,
      userId: builderNft.builderId,
      amount: pendingTx.tokenAmount
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
      amount: pendingTx.tokenAmount
    }
  });
}
