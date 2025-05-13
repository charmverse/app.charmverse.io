import { prisma } from '@charmverse/core/prisma-client';
import { batchUpdatePageProfiles } from '@packages/metrics/mixpanel/batchUpdatePageProfiles';

const perBatch = 1000;
export async function importProposals({ offset = 0 }: { offset?: number } = {}): Promise<void> {
  // Load limited number of spaces at a time
  const pages = await prisma.page.findMany({
    where: {
      type: 'proposal'
    },
    select: { id: true },
    skip: offset,
    take: perBatch,
    orderBy: {
      id: 'asc'
    }
  });
  console.log('page count', pages.length);
  const res = await batchUpdatePageProfiles(pages.map((p) => p.id));
  console.log('res', res);

  if (pages.length > 0) {
    return importProposals({ offset: offset + perBatch });
  }
}

// Just in case a space has a trial sub and active sub, this will prevent overwriting paid plan data with trial plan data
importProposals().then((spacesProcessed) => {
  console.log('Processed', spacesProcessed, 'spaces');
});
