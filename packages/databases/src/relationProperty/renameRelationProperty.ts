import { prisma } from '@charmverse/core/prisma-client';
import { NotFoundError } from '@packages/nextjs/errors';

import { getRelationData } from './getRelationData';
import type { SyncRelationPropertyPayload } from './syncRelationProperty';

export type RenameRelationPropertyPayload = SyncRelationPropertyPayload;

export async function renameRelationProperty(
  payload: RenameRelationPropertyPayload & {
    userId: string;
  }
) {
  const { relatedPropertyTitle, boardId, templateId, userId } = payload;
  const { connectedBoard, connectedBoardProperties, connectedRelationProperty } = await getRelationData({
    boardId,
    templateId
  });

  if (!connectedRelationProperty) {
    throw new NotFoundError('Connected relation property not found');
  }

  return prisma.block.update({
    data: {
      fields: {
        ...(connectedBoard?.fields as any),
        cardProperties: connectedBoardProperties.map((cp) => {
          if (cp.id === connectedRelationProperty.id) {
            return {
              ...cp,
              name: relatedPropertyTitle
            };
          }
          return cp;
        })
      },
      updatedBy: userId
    },
    where: {
      id: connectedBoard.id
    }
  });
}
