import { prisma } from '@charmverse/core/prisma-client';
import { DateTime } from 'luxon';

const spaceDomain = 'cvt-demo-space';
const blockCount = 20;
// One year from today, keep it empty/undefined to allow perpetual blocks
const expiresAt = DateTime.local().plus({ years: 1 }).endOf('day').toJSDate();

async function additionalBlockQuotasForSpaces() {
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      domain: spaceDomain
    },
    select: {
      id: true
    }
  });

  await prisma.additionalBlockQuota.create({
    data: {
      spaceId: space.id,
      blockCount,
      expiresAt
    }
  });
}

additionalBlockQuotasForSpaces().then(() => console.log('done'));
