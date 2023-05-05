import { prisma } from '@charmverse/core';
import type { Block } from '@prisma/client';

import { prismaToBlock } from 'lib/focalboard/block';
import type { IPropertyTemplate } from 'lib/focalboard/board';
import { relay } from 'lib/websockets/relay';

export async function updateDatabaseBlocks(board: Block, properties: IPropertyTemplate[]) {
  const updatedBoard = await prisma.block.update({
    where: {
      id: board.id
    },
    data: {
      fields: {
        ...(board.fields as any),
        cardProperties: properties
      }
    }
  });

  const views = await prisma.block.findMany({
    where: {
      deletedAt: null,
      type: 'view',
      parentId: updatedBoard.id
    }
  });

  const updatedViewBlocks = await prisma.$transaction(
    views.map((block) =>
      prisma.block.update({
        where: { id: block.id },
        data: {
          fields: {
            ...(block.fields as any),
            visiblePropertyIds: [
              ...new Set([...(block.fields as any).visiblePropertyIds, ...properties.map((p) => p.id)])
            ]
          },
          updatedAt: new Date(),
          updatedBy: updatedBoard.createdBy
        }
      })
    )
  );

  relay.broadcast(
    {
      type: 'blocks_updated',
      payload: [prismaToBlock(updatedBoard), ...updatedViewBlocks.map(prismaToBlock)]
    },
    updatedBoard.spaceId
  );
}
