import { prisma } from '@charmverse/core/prisma-client';
import { faker } from '@faker-js/faker';
import { currentSeason, getWeekFromDate } from '@packages/scoutgame/dates';
import { BuilderInfo } from './generateSeedData';
import { DateTime } from 'luxon';
import { randomTimeOfDay } from './generator';
import { builderTokenDecimals } from '@packages/scoutgame/builderNfts/constants';

export async function generateNftPurchaseEvents(scoutId: string, assignedBuilders: BuilderInfo[], date: DateTime) {
  const week = getWeekFromDate(date.toJSDate());
  const totalNftsPurchasedToday = faker.number.int({ min: 0, max: 3 });
  for (let nftCount = 0; nftCount < totalNftsPurchasedToday; nftCount++) {
    const builder = faker.helpers.arrayElement(assignedBuilders);
    if (builder.builderNftId && builder.nftPrice) {
      await prisma.nFTPurchaseEvent.create({
        data: {
          id: faker.string.uuid(),
          scoutId,
          tokensPurchased: 1,
          txHash: faker.finance.ethereumAddress(),
          // Converting points to fiat equivalent in order to reduce the number of points earned
          pointsValue: (Number(builder.nftPrice) / 10 ** builderTokenDecimals),
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
                  value: (Number(builder.nftPrice) / 10 ** builderTokenDecimals)
                }
              }
            }
          }
        }
      });
    }
  }

  return totalNftsPurchasedToday;
}
