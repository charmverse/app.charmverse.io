import { prisma } from '@charmverse/core/prisma-client';
import { batchUpdatePageProfiles } from 'lib/metrics/mixpanel/batchUpdatePageProfiles';

async function importProposals() {
  const pages = await prisma.page.findMany({
    where: {
      type: 'proposal'
    },
    select: { id: true },
    take: 10
  });
  console.log('pages', pages.length);
  const res = await batchUpdatePageProfiles(pages.map((p) => p.id));
  console.log('res', res);
}

// Just in case a space has a trial sub and active sub, this will prevent overwriting paid plan data with trial plan data
importProposals().then((spacesProcessed) => {
  console.log('Processed', spacesProcessed, 'spaces');
});
