/* eslint-disable import/order */
/* eslint-disable import/first */

// load env vars for this file
import { config } from 'dotenv';

config({ path: '.env.test.local' });

import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

export async function teardown() {
  if (process.env.NODE_ENV === 'test') {
    await prisma.space.deleteMany({});

    await prisma.user.deleteMany({});
    // eslint-disable-next-line no-console
    log.debug('✅ Database wiped');
  }
}
