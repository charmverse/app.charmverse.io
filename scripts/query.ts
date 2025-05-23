import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { DateTime } from 'luxon';

import { task as exportSpaceDataTask } from '../apps/cron/src/tasks/exportSpaceData';

async function query() {
  await exportSpaceDataTask();
}

query();
