import type { Page } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { Board } from 'lib/focalboard/board';
import { createDatabaseCardPage } from 'lib/public-api';
import { isTruthy } from 'lib/utilities/types';
import { relay } from 'lib/websockets/relay';

export async function updateCardsFromProposals({ boardPage, userId }: { boardPage: Page; userId: string }) {
  const pageProposals = await prisma.page.findMany({
    where: {
      spaceId: boardPage.spaceId,
      type: 'proposal'
    }
  });

  const existingCards = await prisma.page.findMany({
    where: {
      type: 'card',
      parentId: boardPage.id,
      AND: [{ syncWithPageId: { not: null } }, { syncWithPageId: { not: undefined } }]
    }
  });

  const existingSyncWithPageIds = existingCards.map((card) => card.syncWithPageId).filter(isTruthy);

  const oldPageProposals = pageProposals.filter((page) => existingSyncWithPageIds.includes(page.id));

  /**
   * Case for cards that are linked to a proposal page and need to be updated
   */
  for (const pageProposal of oldPageProposals) {
    const card = existingCards.find((_card) => _card.syncWithPageId === pageProposal.id);
    if (
      card &&
      (card.title !== pageProposal.title ||
        card.hasContent !== pageProposal.hasContent ||
        card.content !== pageProposal.content ||
        card.contentText !== pageProposal.contentText ||
        card.deletedAt !== pageProposal.deletedAt)
    ) {
      const updatedCard = await prisma.page.update({
        where: {
          id: card.id
        },
        data: {
          updatedAt: new Date(),
          updatedBy: userId,
          deletedAt: pageProposal.deletedAt,
          title: pageProposal.title,
          hasContent: pageProposal.hasContent,
          content: pageProposal.content || undefined,
          contentText: pageProposal.contentText
        }
      });

      relay.broadcast(
        {
          type: 'pages_meta_updated',
          payload: [updatedCard]
        },
        updatedCard.spaceId
      );
    }
  }

  const newPageProposals = pageProposals.filter(
    (page) => !existingSyncWithPageIds.includes(page.id) && !page.deletedAt
  );

  const board = (await prisma.block.findUnique({
    where: {
      type: 'board',
      id: boardPage.id,
      spaceId: boardPage.spaceId
    }
  })) as unknown as Board | null;

  const boardCardProp = board?.fields.cardProperties.find((field) => field.type === 'proposalUrl');

  /**
   * Case for new cards to be created from proposal pages and are not included in the current list of cards
   */
  for (const pageProposal of newPageProposals) {
    await createDatabaseCardPage({
      title: pageProposal.title,
      boardId: boardPage.id,
      spaceId: pageProposal.spaceId,
      createdBy: userId,
      properties: { [boardCardProp?.id || '']: `${pageProposal.path}` },
      hasContent: pageProposal.hasContent,
      content: pageProposal.content,
      contentText: pageProposal.contentText,
      syncWithPageId: pageProposal.id
    });
  }

  const nonExistingProposalPages = existingCards
    .filter((card) => card.syncWithPageId && !pageProposals.map((page) => page.id).includes(card.syncWithPageId))
    .map((card) => card.id);

  /**
   * Case where a user permanently deleted a proposal page
   */
  for (const cardToBeDeleted of nonExistingProposalPages) {
    await prisma.page.delete({
      where: {
        id: cardToBeDeleted
      }
    });
  }
}
