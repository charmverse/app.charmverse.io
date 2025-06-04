import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { DateTime } from 'luxon';
import { task as chargeSpacesSubscriptionTask } from '../apps/cron/src/tasks/chargeSpacesSubscription/task';
import { task as exportSpaceDataTask } from '../apps/cron/src/tasks/exportSpaceData';
import { getSpaceTokenBalance } from '@packages/spaces/getSpaceTokenBalance';
import { parseUnits } from 'viem';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
const goldTierPrice = 10_000;
const silverTierPrice = 2_500;

const newTier = 'gold' as const;
const discount = 0.9;
const tierPrice = newTier === 'gold' ? goldTierPrice : silverTierPrice;

async function query() {
  prettyPrint(
    await prisma.space.findFirst({
      where: {
        domain: 'holonlab'
      },
      include: {
        spaceRoles: {
          select: {
            user: {
              select: {
                id: true,
                email: true,
                username: true
              }
            }
          }
        }
      }
    })
  );
  console.log(await getSpaceTokenBalance({ spaceId: '07c4bb6c-4be0-4927-8005-8820abadd783' }));
}

query();
