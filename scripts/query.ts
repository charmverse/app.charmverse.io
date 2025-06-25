import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { DateTime } from 'luxon';
import { task as chargeSpacesSubscriptionTask } from '../apps/cron/src/tasks/chargeSpacesSubscription/task';
import { task as exportSpaceDataTask } from '../apps/cron/src/tasks/exportSpaceData';
import { getSpaceTokenBalance } from '@packages/spaces/getSpaceTokenBalance';
import { parseUnits } from 'viem';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import fs from 'fs';

async function query() {
  console.log(
    await prisma.spaceApiToken.findFirst({
      where: {
        token: 'a7d9294b78576e46406edb2c213b9bceda5384ab'
      },
      include: {
        space: true
      }
    })
  );
}
query();
