'use server';

import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { refreshBuilderNftPrice } from '@packages/scoutgame/builderNfts/refreshBuilderNftPrice';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';

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

  await recordNftMint({ ...params, mintTxHash: txResult.transactionHash });
}

export async function recordNftMint(params: MintNFTParams & { mintTxHash: string }): Promise<void> {
  const { amount, builderNftId, paidWithPoints, pointsValue, recipientAddress, scoutId, mintTxHash } = params;

  if (!mintTxHash.trim().startsWith('0x')) {
    throw new InvalidInputError(`Mint transaction hash is required`);
  }

  const existingTx = await prisma.nFTPurchaseEvent.findFirst({
    where: {
      txHash: mintTxHash
    }
  });

  if (existingTx) {
    log.warn(`Tried to record duplicate tx ${mintTxHash}`, { params, existingTx });
    return;
  }

  const builderNft = await prisma.builderNft.findFirstOrThrow({
    where: {
      id: builderNftId
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

  await prisma.$transaction(async (tx) => {
    await tx.builderEvent.create({
      data: {
        type: 'nft_purchase',
        season: builderNft.season,
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
            paidInPoints: paidWithPoints,
            txHash: mintTxHash?.toLowerCase(),
            builderNftId,
            scoutId,
            activities: {
              create: {
                recipientType: 'builder',
                type: 'nft_purchase',
                userId: builderNft.builderId
              }
            }
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

    await tx.userSeasonStats.upsert({
      where: {
        userId_season: {
          userId: builderNft.builderId,
          season: builderNft.season
        }
      },
      create: {
        nftsSold: amount,
        userId: builderNft.builderId,
        season: builderNft.season,
        pointsEarnedAsBuilder: 0,
        pointsEarnedAsScout: 0
      },
      update: {
        nftsSold: {
          increment: amount
        }
      }
    });
    await tx.userSeasonStats.upsert({
      where: {
        userId_season: {
          userId: scoutId,
          season: builderNft.season
        }
      },
      create: {
        nftsPurchased: amount,
        userId: scoutId,
        season: builderNft.season,
        pointsEarnedAsBuilder: 0,
        pointsEarnedAsScout: 0
      },
      update: {
        nftsPurchased: {
          increment: amount
        }
      }
    });

    if (paidWithPoints) {
      await tx.scout.update({
        where: {
          id: scoutId
        },
        data: {
          currentBalance: {
            decrement: pointsValue
          }
        }
      });
    }
  });
  log.info('Minted NFT', { builderNftId, recipientAddress, tokenId: builderNft.tokenId, amount, userId: scoutId });

  await refreshBuilderNftPrice({ builderId: builderNft.builderId, season: builderNft.season });
}
