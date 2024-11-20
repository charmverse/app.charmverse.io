import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

export default async function wipeTestData() {
  if (process.env.NODE_ENV === 'test') {
    // Reset the database before each test
    await prisma.scoutGameActivity.deleteMany({});
    await prisma.builderStrike.deleteMany({});
    await prisma.nFTPurchaseEvent.deleteMany({});
    await prisma.gemsPayoutEvent.deleteMany({});
    await prisma.pointsReceipt.deleteMany({});
    await prisma.builderNft.deleteMany({});
    await prisma.builderEvent.deleteMany({});
    await prisma.githubEvent.deleteMany({});
    await prisma.githubEvent.deleteMany({});
    await prisma.githubRepo.deleteMany({});
    await prisma.githubUser.deleteMany({});
    await prisma.scout.deleteMany({});
    // eslint-disable-next-line no-console
    log.debug('✅ Database wiped');
  }

  return true;
}
// wipeTestData().then(() => process.exit(0));
