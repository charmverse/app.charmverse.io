import type { Block, Page, Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { PageFieldsForBlock } from '../block';
import { applyPageToBlock, pageFieldsForBlockPrismaSelect } from '../block';
import type { IPropertyTemplate } from '../board';
import type { CardFields } from '../card';

import { getRelationData } from './getRelationData';

export type SyncRelatedCardsValuesPayload = {
  templateId: string;
  cardId: string;
  pageIds: string[];
  boardId: string;
};

async function syncRelatedCards({
  affectedCardPageIds,
  sourceCardId,
  relationProperty,
  operation,
  userId,
  spaceId
}: {
  affectedCardPageIds: string[];
  sourceCardId: string;
  relationProperty: IPropertyTemplate;
  operation: 'remove' | 'add';
  userId: string;
  spaceId: string;
}) {
  const cards = await prisma.block.findMany({
    where: {
      id: {
        in: affectedCardPageIds
      },
      spaceId
    },
    select: {
      id: true,
      fields: true
    }
  });

  return cards.map((card) => {
    const connectedRelationPropertyValue = (card.fields as CardFields).properties[relationProperty.id] as
      | string[]
      | undefined;
    const connectedCardIds = Array.from(
      new Set(connectedRelationPropertyValue ? [sourceCardId, ...connectedRelationPropertyValue] : [sourceCardId])
    );

    return prisma.block.update({
      data: {
        fields: {
          ...(card.fields as any),
          properties: {
            ...(card.fields as CardFields).properties,
            [relationProperty.id]:
              operation === 'remove' ? connectedCardIds.filter((id) => id !== sourceCardId) : connectedCardIds
          }
        },
        updatedBy: userId
      },
      where: {
        id: card.id
      }
    });
  });
}

export async function syncRelatedCardsValues(
  payload: SyncRelatedCardsValuesPayload & {
    userId: string;
  }
) {
  const { cardId, pageIds, templateId, boardId } = payload;

  const card = await prisma.block.findFirstOrThrow({
    where: {
      id: cardId
    },
    select: {
      fields: true
    }
  });

  const { connectedRelationProperty, sourceBoard } = await getRelationData({
    boardId,
    templateId
  });

  const cardFields = card.fields as CardFields;
  const prismaPromises: Prisma.Prisma__BlockClient<Block, never>[] = [];

  if (connectedRelationProperty) {
    const cardRelationPropertyValue = (cardFields.properties[templateId] ?? []) as string[];

    const connectedPageIds = pageIds.filter((id) => !cardRelationPropertyValue.includes(id));
    const disconnectedPageIds = cardRelationPropertyValue.filter((id) => !pageIds.includes(id));

    if (connectedPageIds.length) {
      prismaPromises.push(
        ...(await syncRelatedCards({
          operation: 'add',
          affectedCardPageIds: connectedPageIds,
          relationProperty: connectedRelationProperty,
          sourceCardId: cardId,
          userId: payload.userId,
          spaceId: sourceBoard.spaceId
        }))
      );
    }

    if (disconnectedPageIds.length) {
      prismaPromises.push(
        ...(await syncRelatedCards({
          operation: 'remove',
          affectedCardPageIds: disconnectedPageIds,
          relationProperty: connectedRelationProperty,
          sourceCardId: cardId,
          userId: payload.userId,
          spaceId: sourceBoard.spaceId
        }))
      );
    }
  }

  const updatedBlocks = await prisma.$transaction([
    ...prismaPromises,
    prisma.block.update({
      where: {
        id: cardId
      },
      data: {
        fields: {
          ...(cardFields as any),
          properties: {
            ...(cardFields as CardFields).properties,
            [templateId]: pageIds
          }
        },
        updatedBy: payload.userId
      }
    })
  ]);

  const pages = await prisma.page
    .findMany({
      where: {
        id: {
          in: updatedBlocks.map((b) => b.id)
        }
      },
      select: { ...pageFieldsForBlockPrismaSelect }
    })
    .then((_pages) =>
      _pages.reduce(
        (acc, page) => {
          acc[page.id] = page;

          return acc;
        },
        {} as Record<string, Pick<Page, keyof PageFieldsForBlock>>
      )
    );

  for (const block of updatedBlocks) {
    const matchingPage = pages[block.id];
    if (matchingPage) {
      applyPageToBlock(block, matchingPage);
    }
  }

  return updatedBlocks;
}
