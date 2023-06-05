import type { Page } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

import { prismaToBlock } from 'lib/focalboard/block';
import type { Board } from 'lib/focalboard/board';
import { createDatabaseCardPage } from 'lib/public-api';
import { relay } from 'lib/websockets/relay';

export async function createCardsFromProposals({ boardPage, userId }: { boardPage: Page; userId: string }) {
  const pageProposals = await prisma.page.findMany({
    where: {
      spaceId: boardPage.spaceId,
      type: 'proposal',
      deletedAt: null
    }
  });
  const board = (await prisma.block.findUnique({
    where: {
      type: 'board',
      id: boardPage.id,
      spaceId: boardPage.spaceId
    }
  })) as unknown as Board;

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

  relay.broadcast(
    {
      type: 'blocks_updated',
      payload: [prismaToBlock(updatedBoard)]
    },
    boardPage.spaceId
  );

  const views = await prisma.block.findMany({
    where: {
      type: 'view',
      parentId: boardPage.id
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
      payload: updatedViewBlocks.map(prismaToBlock)
    },
    boardPage.spaceId
  );

  for (const pageProposal of pageProposals) {
    await createDatabaseCardPage({
      title: pageProposal.title,
      boardId: boardPage.id,
      spaceId: pageProposal.spaceId,
      createdBy: userId,
      properties: { [newBoardField.id]: `${pageProposal.path}` },
      hasContent: pageProposal.hasContent,
      content: pageProposal.content,
      contentText: pageProposal.contentText,
      syncWithPageId: pageProposal.id
    });
  }
}
