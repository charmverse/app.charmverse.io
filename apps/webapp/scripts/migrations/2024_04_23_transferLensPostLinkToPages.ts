// @ts-nocheck
import { prisma } from '@charmverse/core/prisma-client';

async function transferLensPostLinkToPages() {
  const proposals = await prisma.proposal.findMany({
    where: {
      lensPostLink: {
        not: null
      }
    },
    select: {
      lensPostLink: true,
      page: {
        select: {
          id: true
        }
      }
    }
  });

  const total = proposals.length;
  let current = 0;

  for (const proposal of proposals) {
    current++;
    try {
      if (proposal.page) {
        await prisma.page.update({
          where: {
            id: proposal.page.id
          },
          data: {
            lensPostLink: proposal.lensPostLink
          }
        });
      }
    } catch (err) {
      console.error(`Failed to transfer lensPostLink for proposal ${proposal.page?.id}`, err);
    } finally {
      console.log(`Processed ${current} of ${total} proposals`);
    }
  }
}

transferLensPostLinkToPages().then(() => null);
