import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

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
