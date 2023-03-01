import { prisma } from 'db';

export async function updateProposlsDraftStatus() {
  await prisma.proposal.updateMany({
    where: {
      status: 'private_draft' as any
    },
    data: {
      status: 'draft',
    },
  });

}

updateProposlsDraftStatus();
