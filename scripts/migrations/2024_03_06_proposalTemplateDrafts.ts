import { prisma } from '@charmverse/core/prisma-client';

export async function migrate() {
  const toUpdate = await prisma.proposal.count({
    where: {
      page: {
        type: 'proposal_template'
      }
    }
  });

  console.log('updating', toUpdate, 'templates');

  const updated = await prisma.proposal.updateMany({
    where: {
      page: {
        type: 'proposal_template'
      }
    },
    data: {
      status: 'published'
    }
  });
  console.log(updated);
}
migrate().catch(console.error);
