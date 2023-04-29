import { prisma } from '@charmverse/core';

import { PageNotFoundError } from 'lib/pages/server';
import { setupPermissionsAfterPageRepositioned } from 'lib/permissions/pages';

/**
 * Used for when a proposal has nested pages (mainly because it was a pre february 2023 proposal), or because it was a page converted to proposal
 * We want to make sure there are no children left behind
 */
export async function disconnectProposalChildren({ pageId }: { pageId: string }) {
  const page = await prisma.page.findFirst({
    where: {
      id: pageId,
      type: {
        // For extra safety, make sure this only applies to proposals and proposal templates
        in: ['proposal', 'proposal_template']
      }
    },
    select: {
      id: true
    }
  });

  if (!page) {
    throw new PageNotFoundError(pageId);
  }
  const childPages = await prisma.page.findMany({
    where: {
      parentId: page.id
    },
    select: {
      id: true
    }
  });

  for (const subPage of childPages) {
    await prisma.$transaction(async (tx) => {
      await tx.page.update({
        where: {
          id: subPage.id
        },
        data: {
          parentId: null
        }
      });

      await setupPermissionsAfterPageRepositioned(subPage.id, tx);
    });
  }
}
