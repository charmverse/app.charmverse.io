'use server';

import { log } from '@charmverse/core/log';
import { PointsDirection, prisma } from '@charmverse/core/prisma-client';
import { builderNftChain } from '@packages/scoutgame/builderNfts/constants';
import { refreshBuilderNftPrice } from '@packages/scoutgame/builderNfts/refreshBuilderNftPrice';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';
import { recordGameActivity } from '@packages/scoutgame/recordGameActivity';

import { getBuilderContractAdminClient } from './clients/builderContractAdminWriteClient';

type MintNFTParams = {
  builderNftId: string;
  recipientAddress: string;
  amount: number;
  pointsValue: number; // total value of purchase, after 50% discount, etc
  paidWithPoints: boolean; // whether to subtract from the scout's points
  scoutId: string;
};

export async function mintNFT(params: MintNFTParams) {
  const { builderNftId, recipientAddress, amount, scoutId, pointsValue, paidWithPoints } = params;
  const builderNft = await prisma.builderNft.findFirstOrThrow({
    where: {
      id: builderNftId
    }
  });
  const apiClient = getBuilderContractAdminClient();

  // Proceed with minting
  const txResult = await apiClient.mintTo({
    args: {
      account: recipientAddress,
      tokenId: BigInt(builderNft.tokenId),
      amount: BigInt(amount),
      scout: scoutId
    }
  });

  // The builder receives 20% of the points value, regardless of whether the purchase was paid with points or not
  const pointsReceipts: { value: number; recipientId?: string; senderId?: string }[] = [
    {
      value: Math.round(pointsValue * 0.2),
      recipientId: builderNft.builderId
    }
  ];

  if (paidWithPoints) {
    pointsReceipts.push({
      value: pointsValue,
      senderId: scoutId
    });
  }

  const builderEvent = await prisma.builderEvent.create({
    data: {
      type: 'nft_purchase',
      season: currentSeason,
      week: getCurrentWeek(),
      builder: {
        connect: {
          id: builderNft.builderId
        }
      },
      nftPurchaseEvent: {
        create: {
          pointsValue,
          tokensPurchased: amount,
          txHash: txResult.transactionHash.toLowerCase(),
          builderNftId,
          scoutId
        }
      },
      pointsReceipts: {
        createMany: {
          data: pointsReceipts
        }
      }
    },
    select: {
      nftPurchaseEventId: true
    }
  });

  log.info('Minted NFT', { builderNftId, recipientAddress, tokenId: builderNft.tokenId, amount, userId: scoutId });

  await refreshBuilderNftPrice({ builderId: builderNft.builderId, season: builderNft.season });

  await recordGameActivity({
    sourceEvent: {
      nftPurchaseEventId: builderEvent.nftPurchaseEventId,
      onchainTxHash: txResult.transactionHash,
      onchainChainId: builderNftChain.id
    },
    activity: {
      pointsDirection: PointsDirection.out,
      userId: builderNft.builderId,
      amount
    }
  });

  await recordGameActivity({
    sourceEvent: {
      nftPurchaseEventId: builderEvent.nftPurchaseEventId,
      onchainTxHash: txResult.transactionHash,
      onchainChainId: builderNftChain.id
    },
    activity: {
      pointsDirection: PointsDirection.in,
      userId: builderNft.builderId,
      amount
    }
  });
}
