import { prisma, Scout } from '@charmverse/core/prisma-client';
import { faker } from '@faker-js/faker';

export async function generateNftPurchaseEvents(scout: Scout, assignedBuilders: {id: string, builderNftId: string}[]) {
  const totalNftsHeld = faker.number.int({ min: 10, max: 50 });
  let nftsLeftToPurchase = totalNftsHeld;

  for (let i = 0; i < assignedBuilders.length; i++) {
    const builder = assignedBuilders[i];
    const nftsToPurchase = Math.min(faker.number.int({ min: 1, max: nftsLeftToPurchase }), Math.floor(nftsLeftToPurchase / assignedBuilders.length));
    nftsLeftToPurchase -= nftsToPurchase;

    if (nftsLeftToPurchase <= 0) {
      break;
    }

    await prisma.nFTPurchaseEvent.createMany({
      data: Array.from({ length: nftsToPurchase }).map(() => ({
        scoutId: scout.id,
        tokensPurchased: 1,
        txHash: faker.finance.ethereumAddress(),
        pointsValue: 0,
        paidInPoints: false,
        builderNftId: builder.builderNftId
      }))
    });
  }
}