import { prisma } from '@charmverse/core/prisma-client';
import { faker } from '@faker-js/faker';
import { currentSeason, getWeekFromDate } from '@packages/scoutgame/dates';
import { BuilderInfo } from './generateSeedData';
import { DateTime } from 'luxon';
import { randomTimeOfDay } from './generator';
import { builderTokenDecimals } from '@packages/scoutgame/builderNfts/constants';

export async function generateNftPurchaseEvents(scoutId: string, assignedBuilders: BuilderInfo[], date: DateTime) {
  const week = getWeekFromDate(date.toJSDate());
  let totalNftsPurchasedToday = 0;
  for (let nftCount = 0; nftCount < faker.number.int({ min: 0, max: 3 }); nftCount++) {
    const builder = faker.helpers.arrayElement(assignedBuilders);
    const createdAt = randomTimeOfDay(date).toJSDate()
    if (builder.builderNftId && builder.nftPrice) {
      const nftsPurchased = faker.number.int({ min: 1, max: 5 });
      totalNftsPurchasedToday += nftsPurchased;
      await prisma.$transaction(async (tx) => {
        const builderNftId = builder.builderNftId as string;
        const nftPrice = builder.nftPrice as number;
        const pointsValue = (Number(nftPrice * nftsPurchased) / 10 ** builderTokenDecimals);

        await tx.builderNft.update({
          where: {
            id: builder.builderNftId
          },
          data: {
            currentPrice: nftPrice + (nftPrice * 0.1)
          }
        }),
        await tx.nFTPurchaseEvent.create({
          data: {
            id: faker.string.uuid(),
            scoutId,
            tokensPurchased: nftsPurchased,
            txHash: faker.finance.ethereumAddress(),
            // Converting points to fiat equivalent in order to reduce the number of points earned
            pointsValue,
            paidInPoints: false,
            builderNftId,
            activities: {
              create: {
                recipientType: 'builder',
                type: 'nft_purchase',
                userId: builder.id,
                createdAt
              }
            },
            builderEvent: {
              create: {
                id: faker.string.uuid(),
                builderId: builder.id,
                season: currentSeason,
                week,
                type: 'nft_purchase',
                createdAt,
                pointsReceipts: {
                  create: {
                    id: faker.string.uuid(),
                    recipientId: builder.id,
                    value: pointsValue * 0.1,
                    createdAt
                  }
                }
              }
            }
          }
        });
      })
    }
  }

  return totalNftsPurchasedToday;
}
