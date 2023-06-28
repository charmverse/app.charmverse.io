import { DataNotFoundError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { Block, Page } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

import { prismaToBlock } from 'lib/focalboard/block';
import type { Board } from 'lib/focalboard/board';
import { relay } from 'lib/websockets/relay';

import { createCardPage } from './createCardPage';

export async function createCardsFromProposals({
  boardId,
  spaceId,
  userId
}: {
  boardId: string;
  spaceId: string;
  userId: string;
}) {
  const pageProposals = await prisma.page.findMany({
    where: {
      spaceId,
      type: 'proposal',
      proposal: {
        status: {
          not: 'draft'
        }
      },
      deletedAt: null
    },
    include: {
      workspaceEvents: true
    }
  });
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

  const newBoardField = {
    id: uuid(),
    name: 'Proposal Url',
    description: null,
    type: 'proposalUrl',
    options: []
  };

  const updatedBoard = await prisma.block.update({
    where: {
      id: board.id
    },
    data: {
      fields: {
        ...(board.fields as any),
        cardProperties: [...(board.fields?.cardProperties || []), newBoardField]
      }
    }
  });

  const views = await prisma.block.findMany({
    where: {
      type: 'view',
      parentId: boardId
    }
  });

  const updatedViewBlocks = await prisma.$transaction(
    views.map((block) => {
      return prisma.block.update({
        where: { id: block.id },
        data: {
          fields: {
            ...(block.fields as any),
            visiblePropertyIds: [...new Set([...(block.fields as any).visiblePropertyIds, newBoardField.id])],
            sourceType: 'proposals'
          },
          updatedAt: new Date(),
          updatedBy: userId
        }
      });
    })
  );

  relay.broadcast(
    {
      type: 'blocks_updated',
      payload: updatedViewBlocks.map(prismaToBlock).concat(prismaToBlock(updatedBoard))
    },
    spaceId
  );

  const cards: { page: Page; block: Block }[] = [];
  for (const pageProposal of pageProposals) {
    const createdAt = pageProposal.workspaceEvents.find(
      (event) => event.type === 'proposal_status_change' && (event.meta as any).newStatus === 'discussion'
    )?.createdAt;
    const _card = await createCardPage({
      title: pageProposal.title,
      boardId,
      spaceId: pageProposal.spaceId,
      createdAt,
      createdBy: userId,
      properties: { [newBoardField.id]: `${pageProposal.path}` },
      hasContent: pageProposal.hasContent,
      content: pageProposal.content,
      contentText: pageProposal.contentText,
      syncWithPageId: pageProposal.id
    });
    cards.push(_card);
  }

  if (cards.length > 0) {
    relay.broadcast(
      {
        type: 'blocks_created',
        payload: cards.map((card) => prismaToBlock(card.block))
      },
      spaceId
    );
    relay.broadcast(
      {
        type: 'pages_created',
        payload: cards.map((card) => card.page)
      },
      spaceId
    );
  }

  log.debug('Created cards from new Proposals', {
    boardId,
    createdCardPagesCount: pageProposals.length
  });

  return cards.map((card) => card.page);
}
