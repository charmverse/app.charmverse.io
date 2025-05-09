import type { Block, Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { NotFoundError } from '@packages/nextjs/errors';

import { getRelationData } from './getRelationData';

export type RemoveRelationPropertyPayload = {
  boardId: string;
  templateId: string;
  removeBoth?: boolean;
};

export async function removeRelationProperty(payload: RemoveRelationPropertyPayload & { userId: string }) {
  const { userId, boardId, templateId, removeBoth } = payload;
  const {
    sourceBoard,
    sourceBoardProperties,
    sourceRelationProperty,
    connectedBoard,
    connectedBoardProperties,
    connectedRelationProperty
  } = await getRelationData({
    boardId,
    templateId
  });

  if (!connectedRelationProperty) {
    throw new NotFoundError('Connected relation property not found');
  }

  const prismaPromises: Prisma.Prisma__BlockClient<Block, never>[] = [];

  if (sourceBoard.id === connectedBoard.id) {
    const updatedCardProperties = sourceBoardProperties.filter((cp) => cp.id !== sourceRelationProperty.id);
    prismaPromises.push(
      prisma.block.update({
        data: {
          fields: {
            ...(sourceBoard?.fields as any),
            cardProperties: removeBoth
              ? updatedCardProperties.filter((cp) => cp.id !== connectedRelationProperty.id)
              : updatedCardProperties.map((cp) => {
                  if (cp.id === connectedRelationProperty.id) {
                    return {
                      ...cp,
                      relationData: {
                        ...cp.relationData,
                        relatedPropertyId: null,
                        showOnRelatedBoard: false
                      }
                    };
                  }
                  return cp;
                })
          },
          updatedBy: userId
        },
        where: {
          id: sourceBoard.id
        }
      })
    );
  } else {
    prismaPromises.push(
      prisma.block.update({
        data: {
          fields: {
            ...(sourceBoard?.fields as any),
            cardProperties: sourceBoardProperties.filter((cp) => cp.id !== sourceRelationProperty.id)
          },
          updatedBy: userId
        },
        where: {
          id: sourceBoard.id
        }
      }),
      prisma.block.update({
        data: {
          fields: {
            ...(connectedBoard?.fields as any),
            cardProperties: removeBoth
              ? connectedBoardProperties.filter((cp) => cp.id !== connectedRelationProperty.id)
              : connectedBoardProperties.map((cp) => {
                  if (cp.id === connectedRelationProperty.id) {
                    return {
                      ...cp,
                      relationData: {
                        ...cp.relationData,
                        relatedPropertyId: null,
                        showOnRelatedBoard: false
                      }
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
      })
    );
  }

  return prisma.$transaction(prismaPromises);
}
