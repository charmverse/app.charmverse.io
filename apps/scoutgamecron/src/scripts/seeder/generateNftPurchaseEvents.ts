import { prisma } from '@charmverse/core/prisma-client';
import { faker } from '@faker-js/faker';
import { builderTokenDecimals } from '@packages/scoutgame/builderNfts/constants';
import { recordNftMintWithoutRefresh } from '@packages/scoutgame/builderNfts/recordNftMint';
import { getWeekFromDate } from '@packages/scoutgame/dates';
import { DateTime } from 'luxon';
import { BuilderInfo } from './generateSeedData';
import { randomTimeOfDay } from './generator';

export async function generateNftPurchaseEvents(scoutId: string, assignedBuilders: BuilderInfo[], date: DateTime) {
  const week = getWeekFromDate(date.toJSDate());
  let totalNftsPurchasedToday = 0;
  for (let nftCount = 0; nftCount < faker.number.int({ min: 0, max: 3 }); nftCount++) {
    const builder = faker.helpers.arrayElement(assignedBuilders);
    const createdAt = randomTimeOfDay(date).toJSDate();
    if (builder.builderNftId && builder.nftPrice) {
      const nftsPurchased = faker.number.int({ min: 1, max: 5 });
      totalNftsPurchasedToday += nftsPurchased;
      await prisma.$transaction(async (tx) => {
        const builderNftId = builder.builderNftId as string;
        const nftPrice = builder.nftPrice as number;
        const pointsValue = Number(nftPrice * nftsPurchased) / 10 ** builderTokenDecimals;

        await tx.builderNft.update({
          where: {
            id: builder.builderNftId
          },
          data: {
            currentPrice: Math.ceil(nftPrice + nftPrice * 0.1),
          }
        })

        await recordNftMintWithoutRefresh({
          builderNftId,
          amount: nftsPurchased,
          paidWithPoints: false,
          pointsValue,
          scoutId,
          mintTxHash: faker.finance.ethereumAddress(),
          recipientAddress: faker.finance.ethereumAddress(),
          createdAt
        });
      });
    }
  }

  return totalNftsPurchasedToday;
}
