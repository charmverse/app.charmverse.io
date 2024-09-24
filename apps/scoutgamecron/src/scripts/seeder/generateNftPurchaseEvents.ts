import { prisma } from '@charmverse/core/prisma-client';
import { faker } from '@faker-js/faker';
import { currentSeason, getCurrentWeek, getWeekStartEnd } from '@packages/scoutgame/utils';

export async function generateNftPurchaseEvents(scoutId: string, assignedBuilders: {id: string, builderNftId: string}[]) {
  const totalNftsHeld = faker.number.int({ min: 0, max: 25 });
  let nftsLeftToPurchase = totalNftsHeld;
  const { start } = getWeekStartEnd(new Date());

  for (let i = 0; i < assignedBuilders.length; i++) {
    const createdAt = faker.date.between({ from: start.toJSDate(), to: new Date() });

    const builder = assignedBuilders[i];
    const nftsToPurchase = Math.min(faker.number.int({ min: 1, max: nftsLeftToPurchase }), Math.floor(nftsLeftToPurchase / assignedBuilders.length));
    nftsLeftToPurchase -= nftsToPurchase;

    if (nftsLeftToPurchase <= 0) {
      break;
    }

    const nftPurchaseEventIds = Array.from({ length: nftsToPurchase }).map(() => faker.string.uuid());

    await prisma.nFTPurchaseEvent.createMany({
      data: nftPurchaseEventIds.map((id) => ({
        id,
        scoutId,
        tokensPurchased: 1,
        txHash: faker.finance.ethereumAddress(),
        pointsValue: 0,
        paidInPoints: false,
        builderNftId: builder.builderNftId,
      }))
    });

    await prisma.builderEvent.createMany({
      data: nftPurchaseEventIds.map((id) => ({
        builderId: builder.id,
        season: currentSeason,
        week: getCurrentWeek(),
        type: "nft_purchase",
        nftPurchaseEventId: id,
        createdAt
      }))
    });
  }
}