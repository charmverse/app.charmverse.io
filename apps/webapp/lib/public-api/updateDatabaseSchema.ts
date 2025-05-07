import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import { prismaToBlock } from '@packages/databases/block';
import { relay } from 'lib/websockets/relay';

import { DatabasePageNotFoundError } from './errors';
import type { PageProperty } from './interfaces';

/**
 * @properties - Should be the full set of properties this board has going forward
 */
type DbSchemaUpdate = {
  boardId: string;
  properties: PageProperty[];
};

export async function updateDatabaseSchema({ boardId, properties }: DbSchemaUpdate) {
  if (!boardId || !stringUtils.isUUID(boardId)) {
    throw new InvalidInputError(`Invalid board ID: ${boardId}`);
  }

  const boardBlock = await prisma.block.findFirst({
    where: {
      type: 'board',
      id: boardId
    }
  });

  if (!boardBlock) {
    throw new DatabasePageNotFoundError(boardId);
  }
  const updatedBoard = await prisma.block.update({
    where: {
      id: boardId
    },
    data: {
      fields: {
        ...(boardBlock.fields as any),
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
