import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { DateTime } from 'luxon';

import { task as exportSpaceDataTask } from '../apps/cron/src/tasks/exportSpaceData';

const goldTierPrice = 10_000;
const silverTierPrice = 2_500;

const newTier = 'gold' as const;
const discount = 0.5;
const tierPrice = newTier === 'gold' ? goldTierPrice : silverTierPrice;

async function query() {
  const space = await prisma.space.findFirstOrThrow({
    where: {
      domain: 'prezenti-grants'
    }
  });
  const newPrice = Math.round(tierPrice * (1 - discount));

  prisma.space.update({
    where: {
      id: space.id
    },
    data: {
      subscriptionTier: newTier
    }
  });
  console.log(space.name, '(' + newTier + ')', '-', newPrice);
}

query();
