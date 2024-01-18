import { prisma } from '@charmverse/core/prisma-client';
import { DateTime } from 'luxon';

async function additionalBlockQuotasForSpaces() {
  const spaceDomain = "cvt-demo-space";
  const blockCount = 20;
  // One year from today, keep it empty to allow perpetual blocks
  const expiresAt = DateTime.local().plus({ years: 1 }).endOf('day').toJSDate();

  const space = await prisma.space.findUniqueOrThrow({
    where: {
      domain: spaceDomain
    },
    select: {
      id: true
    }
  })

  await prisma.additionalBlockQuota.createMany({
    data: {
      spaceId: space.id,
      blockCount,
      expiresAt
    }
  })
}

additionalBlockQuotasForSpaces().then(() => console.log('done'));
