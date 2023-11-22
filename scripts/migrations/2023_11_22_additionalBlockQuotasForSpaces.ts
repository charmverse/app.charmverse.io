import { prisma } from '@charmverse/core/prisma-client';

async function additionalBlockQuotasForSpaces(data: {
  winner: boolean
  spaceId: string
}[]) {
  await prisma.additionalBlockQuota.createMany({
    data: data.map(({spaceId, winner}) => ({
      spaceId,
      blockCount: winner ? 100000 : 20000,
      expiration: new Date('2024-11-22T00:00:00.000Z'),
    }))
  })
}

additionalBlockQuotasForSpaces([]).then(() => console.log('done'));
