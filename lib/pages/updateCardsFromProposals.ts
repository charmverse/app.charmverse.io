import { DataNotFoundError } from '@charmverse/core/errors';
import type { Block, Page } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { prismaToBlock } from 'lib/focalboard/block';
import type { Board } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import { InvalidStateError } from 'lib/middleware';
import { isTruthy } from 'lib/utilities/types';
import { relay } from 'lib/websockets/relay';

import { createCardPage } from './createCardPage';

export async function updateCardsFromProposals({
  boardId,
  spaceId,
  userId
}: {
  boardId: string;
  spaceId: string;
  userId: string;
}) {
  const board = (await prisma.block.findUnique({
    where: {
      type: 'board',
      id: boardId,
      spaceId
    }
  })) as unknown as Board | undefined;

  if (!board) {
    throw new DataNotFoundError('Database was not found');
  }

  const views = (
    await prisma.block.findMany({
      where: {
        type: 'view',
        parentId: boardId
      }
    })
  ).map(prismaToBlock) as BoardView[];

  // Ideally all the views should have sourceType proposal when created, but there are views which doesn't have sourceType proposal even though they are created from proposal source
  if (!views.find((view) => view.fields.sourceType === 'proposals')) {
    throw new InvalidStateError('Board does not have a proposals view');
  }

  const pageProposals = await prisma.page.findMany({
    where: {
      spaceId,
      type: 'proposal',
      proposal: {
        status: {
          not: 'draft'
        }
      }
    },
    include: {
      workspaceEvents: true
    }
  });

  const existingCards = await prisma.page.findMany({
    where: {
      type: 'card',
      parentId: boardId,
      spaceId,
      AND: [{ syncWithPageId: { not: null } }, { syncWithPageId: { not: undefined } }]
    }
  });

  const existingSyncWithPageIds = existingCards.map((card) => card.syncWithPageId).filter(isTruthy);

  const oldPageProposals = pageProposals.filter((page) => existingSyncWithPageIds.includes(page.id));

  /**
   * Case for cards that are linked to a proposal page and need to be updated
   */
  const updatedCards: Page[] = [];
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
      updatedCards.push(updatedCard);
    }
  }

  if (updatedCards.length > 0) {
    relay.broadcast(
      {
        type: 'pages_meta_updated',
        payload: updatedCards.map(
          ({ id, updatedAt, updatedBy, deletedAt, title, hasContent, content, contentText }) => ({
            id,
            spaceId,
            updatedAt,
            updatedBy,
            deletedAt,
            title,
            hasContent,
            content,
            contentText
          })
        )
      },
      spaceId
    );
  }

  const newPageProposals = pageProposals.filter(
    (page) => !existingSyncWithPageIds.includes(page.id) && !page.deletedAt
  );

  const boardBlock = (await prisma.block.findUnique({
    where: {
      type: 'board',
      id: boardId,
      spaceId
    }
  })) as unknown as Board | null;

  const boardCardProp = boardBlock?.fields.cardProperties.find((field) => field.type === 'proposalUrl');

  /**
   * Case for new cards to be created from proposal pages and are not included in the current list of cards
   */
  const newCards: { page: Page; block: Block }[] = [];
  for (const pageProposal of newPageProposals) {
    const createdAt = pageProposal.workspaceEvents.find(
      (event) => event.type === 'proposal_status_change' && (event.meta as any).newStatus === 'discussion'
    )?.createdAt;
    const _card = await createCardPage({
      title: pageProposal.title,
      boardId,
      spaceId: pageProposal.spaceId,
      createdAt,
      createdBy: userId,
      properties: { [boardCardProp?.id || '']: `${pageProposal.path}` },
      hasContent: pageProposal.hasContent,
      content: pageProposal.content,
      contentText: pageProposal.contentText,
      syncWithPageId: pageProposal.id
    });
    newCards.push(_card);
  }

  if (newCards.length > 0) {
    relay.broadcast(
      {
        type: 'blocks_created',
        payload: newCards.map((card) => prismaToBlock(card.block))
      },
      spaceId
    );
    relay.broadcast(
      {
        type: 'pages_created',
        payload: newCards.map((card) => card.page)
      },
      spaceId
    );
  }

  const nonExistingProposalPagesIds = existingCards
    .filter((card) => card.syncWithPageId && !pageProposals.map((page) => page.id).includes(card.syncWithPageId))
    .map((card) => card.id);

  /**
   * Case where a user permanently deleted a proposal page
   */
  for (const cardToBeDeleted of nonExistingProposalPagesIds) {
    await prisma.page.delete({
      where: {
        id: cardToBeDeleted
      }
    });
  }

  if (nonExistingProposalPagesIds.length > 0) {
    relay.broadcast(
      {
        type: 'pages_deleted',
        payload: nonExistingProposalPagesIds.map((id) => ({ id }))
      },
      spaceId
    );
  }
}
