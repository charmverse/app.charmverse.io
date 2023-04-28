import { prisma } from '@charmverse/core';

import log from 'lib/log';

async function wipeTestData() {
  if (process.env.NODE_ENV === 'test') {
    await prisma.space.deleteMany({});

    await prisma.user.deleteMany({});
    // eslint-disable-next-line no-console
    log.debug('✅ Database wiped');
  }

  return true;
}
wipeTestData().then(() => process.exit(0));
