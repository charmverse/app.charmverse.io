import type { Page, Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import _ from 'lodash';

const pageSelectObject = {
  id: true,
  title: true,
  hasContent: true,
  content: true,
  contentText: true,
  deletedAt: true
} as const;

type ProposalPage = Prisma.PageGetPayload<{ select: typeof pageSelectObject }>;

async function fetchAndProcessProposalPages({
  cursor = null,
  spaceId,
  process
}: {
  process: (proposalPages: ProposalPage[]) => Promise<void>;
  cursor?: string | null;
  spaceId: string;
}) {
  const batchSize = 100;
  const proposalPages = await prisma.page.findMany({
    where: {
      spaceId,
      type: 'proposal',
      proposal: {
        status: 'published'
      }
    },
    orderBy: {
      createdAt: 'asc'
    },
    take: batchSize,
    skip: cursor ? 1 : undefined,
    cursor: cursor ? { id: cursor } : undefined,
    select: pageSelectObject
  });

  if (proposalPages.length === batchSize) {
    const nextCursor = proposalPages[proposalPages.length - 1].id;
    await process(proposalPages);
    await fetchAndProcessProposalPages({
      cursor: nextCursor,
      spaceId,
      process
    });
  } else {
    await process(proposalPages);
  }
}

export async function updateCardsFromProposals({ boardId, spaceId }: { boardId: string; spaceId: string }) {
  const proposalPagesLite = await prisma.page.findMany({
    where: {
      spaceId,
      type: 'proposal',
      proposal: {
        status: {
          not: 'draft'
        }
      }
    },
    select: {
      id: true,
      proposal: {
        select: {
          id: true,
          formId: true
        }
      }
    }
  });

  const pageIdsSet = new Set(proposalPagesLite.map((p) => p.id));

  const existingCardPages = await prisma.page.findMany({
    where: {
      type: 'card',
      parentId: boardId,
      spaceId,
      syncWithPageId: {
        not: null
      }
    }
  });

  // Synced pages with a key referencing the proposal they belong to
  const existingCardPageMap = existingCardPages.reduce<Record<string, Page>>((acc, cardPage) => {
    acc[cardPage.syncWithPageId as string] = cardPage;
    return acc;
  }, {});

  /**
   * Case for cards that are linked to a proposal page and need to be updated
   */
  const updatedPages: Page[] = [];

  await fetchAndProcessProposalPages({
    spaceId,
    process: async (proposalPages) => {
      for (const pageWithProposal of proposalPages) {
        const card = existingCardPageMap[pageWithProposal.id];

        if (card) {
          if (
            card.title !== pageWithProposal.title ||
            card.contentText !== pageWithProposal.contentText ||
            card.deletedAt !== pageWithProposal.deletedAt
          ) {
            const updatedCardPage = await prisma.page.update({
              where: {
                id: card.id
              },
              data: {
                deletedAt: pageWithProposal.deletedAt,
                title: pageWithProposal.title,
                hasContent: pageWithProposal.hasContent,
                content: pageWithProposal.content || undefined,
                contentText: pageWithProposal.contentText
              }
            });
            updatedPages.push(updatedCardPage);
          }
        }
      }
    }
  });

  const orphanPageIds = existingCardPages
    .filter((card) => card.syncWithPageId && !pageIdsSet.has(card.syncWithPageId))
    .map((card) => card.id);

  /**
   * Case where a user permanently deleted a proposal page
   */
  if (orphanPageIds.length > 0) {
    await prisma.page.deleteMany({
      where: {
        id: {
          in: orphanPageIds
        }
      }
    });
    await prisma.block.deleteMany({
      where: {
        id: {
          in: orphanPageIds
        }
      }
    });
  }

  return {
    deleted: orphanPageIds.length,
    updated: updatedPages.length
  };
}
