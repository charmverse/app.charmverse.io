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
  tokenId: bigint;
  amount: number;
  scoutId: string;
};

export async function mintNFT(params: MintNFTParams) {
  const { builderNftId, recipientAddress, tokenId, amount, scoutId } = params;
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
      tokenId,
      amount: BigInt(amount),
      scout: scoutId
    }
  });

  const nftEvent = await prisma.nFTPurchaseEvent.create({
    data: {
      pointsValue: 0,
      tokensPurchased: amount,
      txHash: txResult.transactionHash.toLowerCase(),
      builderNftId,
      scoutId,
      builderEvent: {
        create: {
          type: 'nft_purchase',
          season: currentSeason,
          week: getCurrentWeek(),
          builder: {
            connect: {
              id: builderNft.builderId
            }
          }
        }
      }
    }
  });

  log.info('Minted NFT', { builderNftId, recipientAddress, tokenId, amount, userId: scoutId });

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
      amount
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
      amount
    }
  });
}
