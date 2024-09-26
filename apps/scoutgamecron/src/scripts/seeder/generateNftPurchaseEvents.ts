import { prisma } from '@charmverse/core/prisma-client';
import { faker } from '@faker-js/faker';
import { currentSeason, getWeekFromDate } from '@packages/scoutgame/dates';
import { BuilderInfo } from './generateSeedData';
import { DateTime } from 'luxon';
import { randomTimeOfDay } from './generator';

export async function generateNftPurchaseEvents(scoutId: string, assignedBuilders: BuilderInfo[], date: DateTime) {
  const week = getWeekFromDate(date.toJSDate());
  const totalNftsPurchasedToday = faker.number.int({ min: 0, max: 3 });
  for (let nftCount = 0; nftCount < totalNftsPurchasedToday; nftCount++) {
    const builder = faker.helpers.arrayElement(assignedBuilders);
    await prisma.nFTPurchaseEvent.create({
      data: {
        id: faker.string.uuid(),
        scoutId,
        tokensPurchased: 1,
        txHash: faker.finance.ethereumAddress(),
        pointsValue: builder.nftPrice,
        paidInPoints: false,
        builderNftId: builder.builderNftId,
        builderEvent: {
          create: {
            id: faker.string.uuid(),
            builderId: builder.id,
            season: currentSeason,
            week,
            type: 'nft_purchase',
            createdAt: randomTimeOfDay(date).toJSDate(),
            pointsReceipts: {
              create: {
                id: faker.string.uuid(),
                recipientId: builder.id,
                value: builder.nftPrice
              }
            }
          }
        }
      }
    });
  }

  return totalNftsPurchasedToday;
}
