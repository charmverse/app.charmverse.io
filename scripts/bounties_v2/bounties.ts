import { prisma } from 'db';
import { rollupBountyStatus } from 'lib/bounties/rollupBountyStatus';
import log from 'lib/log';

export async function convertAssignedAndReviewBountiesToInProgress () {
  /*
  return prisma.bounty.updateMany({
    where: {
      status: {
        in: ['assigned', 'review']
      }
    },
    data: {
      status: 'inProgress'
    }
  });
  */
  return true;
}

export async function applyDefaultSettings () {
  return prisma.bounty.updateMany({
    where: {},
    data: {
      maxSubmissions: 1,
      approveSubmitters: true
    }
  });
}

const CONCURRENT = 3;

// Final step
export async function rollupExistingBounties () {
  const bounties = await prisma.bounty.findMany();

  const totalBounties = bounties.length;

  for (let i = 0; i < bounties.length; i += CONCURRENT) {

    log.info('Rolling up bounties ', i + 1, '-', i + 1 + CONCURRENT, ' / ', totalBounties);

    const sliced = bounties.slice(i, i + CONCURRENT);
    await Promise.all(sliced.map(bounty => rollupBountyStatus(bounty.id)));
  }

  return true;
}
