import { prisma } from '@charmverse/core/prisma-client';
import { DateTime } from 'luxon';

async function additionalBlockQuotasForSpaces(
  data: {
    winner: boolean;
    spaceId: string;
  }[]
) {
  await prisma.additionalBlockQuota.createMany({
    data: data.map(({ spaceId, winner }) => ({
      spaceId,
      blockCount: winner ? 100 : 20,
      expiresAt: DateTime.local().plus({ years: 1 }).endOf('day').toJSDate()
    }))
  });
}

additionalBlockQuotasForSpaces([]).then(() => console.log('done'));
