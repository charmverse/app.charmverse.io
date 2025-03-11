import { prisma } from '@charmverse/core/prisma-client';
import { InvalidStateError, NotFoundError } from '@packages/nextjs/errors';

import type { BoardFields, IPropertyTemplate } from '../board';

export async function getRelationData({ boardId, templateId }: { boardId: string; templateId: string }) {
  const sourceBoard = await prisma.block.findUniqueOrThrow({
    where: {
      id: boardId
    },
    select: {
      id: true,
      fields: true,
      spaceId: true
    }
  });

  const sourceBoardPage = await prisma.page.findFirstOrThrow({
    where: {
      boardId
    },
    select: {
      id: true,
      title: true
    }
  });

  const sourceBoardProperties = (sourceBoard.fields as unknown as BoardFields).cardProperties;

  const sourceRelationProperty = sourceBoardProperties.find((p) => p.id === templateId);
  if (!sourceBoardPage || !sourceRelationProperty || !sourceRelationProperty.relationData) {
    throw new NotFoundError('Relation type board property not found');
  }

  const connectedBoard = await prisma.block.findUniqueOrThrow({
    where: {
      id: sourceRelationProperty.relationData.boardId
    },
    select: {
      id: true,
      fields: true,
      spaceId: true
    }
  });

  if (sourceBoard.spaceId !== connectedBoard.spaceId) {
    throw new InvalidStateError('Boards are not in the same space');
  }

  const connectedBoardProperties = (connectedBoard.fields as unknown as BoardFields).cardProperties;
  const connectedRelationProperty = connectedBoardProperties.find(
    (p) => p.id === sourceRelationProperty.relationData?.relatedPropertyId
  );

  return {
    sourceBoardProperties,
    sourceBoard,
    sourceBoardPage,
    sourceRelationProperty: sourceRelationProperty as Omit<IPropertyTemplate, 'relationData'> & {
      relationData: NonNullable<IPropertyTemplate['relationData']>;
    },
    connectedBoard,
    connectedRelationProperty,
    connectedBoardProperties
  };
}
