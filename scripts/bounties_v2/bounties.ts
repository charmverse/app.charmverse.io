import { prisma } from 'db';
import { rollupBountyStatus } from 'lib/bounties/rollupBountyStatus';

export async function convertAssignedAndReviewBountiesToInProgress () {
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

export async function rollupExistingBounties () {
  const bounties = await prisma.bounty.findMany();

  for (let i = 0; i < bounties.length; i += CONCURRENT) {
    const sliced = bounties.slice(i, i + CONCURRENT);
    await Promise.all(sliced.map(bounty => rollupBountyStatus(bounty.id)));
  }

  return true;
}
