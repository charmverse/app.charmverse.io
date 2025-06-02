import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { DateTime } from 'luxon';
import { task as chargeSpacesSubscriptionTask } from '../apps/cron/src/tasks/chargeSpacesSubscription/task';
import { task as exportSpaceDataTask } from '../apps/cron/src/tasks/exportSpaceData';
import { getSpaceTokenBalance } from '@packages/spaces/getSpaceTokenBalance';
import { parseUnits } from 'viem';
const goldTierPrice = 10_000;
const silverTierPrice = 2_500;

const newTier = 'gold' as const;
const discount = 0.9;
const tierPrice = newTier === 'gold' ? goldTierPrice : silverTierPrice;

async function query() {
  await chargeSpacesSubscriptionTask();
  // console.log(space.name, space.id, '(' + space.subscriptionTier + ')', '-', space.subscriptionMonthlyPrice);
  return;
  const newPrice = Math.round(tierPrice * (1 - discount));

  await prisma.space.update({
    where: {
      id: space.id
    },
    data: {
      subscriptionTier: newTier,
      subscriptionMonthlyPrice: newPrice
    }
  });
  console.log(space.name, space.id, '(' + newTier + ')', '-', newPrice);
}

query();
