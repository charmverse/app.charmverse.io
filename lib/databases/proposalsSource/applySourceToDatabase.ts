import { prisma } from '@charmverse/core/prisma-client';

import { prismaToBlock, prismaToUIBlock } from 'lib/databases/block';
import { DEFAULT_BOARD_BLOCK_ID } from 'lib/proposals/blocks/constants';
import { relay } from 'lib/websockets/relay';

import type { Board, BoardFields } from '../board';
import type { BoardViewFields } from '../boardView';

import { updateDatabaseProposalProperties } from './updateDatabaseProposalProperties';

export async function applySourceToDatabase({ boardId, spaceId }: { boardId: string; spaceId: string }) {
  const proposalBoardBlock = (await prisma.proposalBlock.findUnique({
    where: {
      id_spaceId: {
        id: DEFAULT_BOARD_BLOCK_ID,
        spaceId
      }
    },
    select: {
      fields: true
    }
  })) as null | { fields: BoardFields };

  const [dbBlock, boardPage] = await Promise.all([
    updateDatabaseProposalProperties({
      boardId,
      cardProperties: proposalBoardBlock?.fields.cardProperties ?? []
    }),
    prisma.page.findFirstOrThrow({
      where: {
        boardId
      }
    })
  ]);
  const boardBlock = prismaToUIBlock(dbBlock, boardPage) as Board;

  const views = await prisma.block.findMany({
    where: {
      type: 'view',
      parentId: boardId
    }
  });

  const proposalEvaluationTypeProperty = boardBlock.fields.cardProperties.find(
    (cardProperty) => cardProperty.type === 'proposalEvaluationType'
  );

  const updatedViewBlocks = await prisma.$transaction(
    views.map((block) => {
      return prisma.block.update({
        where: { id: block.id },
        data: {
          fields: {
            ...(block.fields as BoardViewFields),
            // Hide the proposal evaluation type property from the view
            visiblePropertyIds: [
              ...new Set([
                ...(block.fields as BoardViewFields).visiblePropertyIds,
                ...(boardBlock.fields as any as BoardFields).cardProperties.map((p) => p.id)
              ])
            ].filter((id) => id !== proposalEvaluationTypeProperty?.id),
            sourceType: 'proposals'
          },
          updatedAt: new Date(),
          updatedBy: dbBlock.createdBy
        }
      });
    })
  );

  relay.broadcast(
    {
      type: 'blocks_updated',
      payload: updatedViewBlocks.map(prismaToBlock).concat(boardBlock)
    },
    spaceId
  );
}
