import { prisma } from '@charmverse/core/prisma-client';

import { isTruthy } from 'lib/utilities/types';

import type { IPropertyTemplate } from './board';
import type { CardFields } from './card';

export async function syncRelationPropertyCards({
  affectedCardPageIds,
  sourceCardId,
  relationProperty,
  operation
}: {
  affectedCardPageIds: string[];
  sourceCardId: string;
  relationProperty: IPropertyTemplate;
  operation: 'remove' | 'add';
}) {
  const cardPages = await prisma.page.findMany({
    where: {
      id: {
        in: affectedCardPageIds
      }
    },
    select: {
      id: true,
      cardId: true
    }
  });

  const cards = await prisma.block.findMany({
    where: {
      id: {
        in: cardPages.map((p) => p.cardId).filter(isTruthy)
      }
    },
    select: {
      id: true,
      fields: true
    }
  });

  await prisma.$transaction(
    cards
      .map((card) => {
        const connectedRelationPropertyValue = (card.fields as CardFields).properties[relationProperty.id] as
          | string[]
          | undefined;
        const connectedCardIds = Array.from(
          new Set(
            relationProperty.relationData?.limit === 'single_page'
              ? [sourceCardId]
              : connectedRelationPropertyValue
              ? [...connectedRelationPropertyValue, sourceCardId]
              : [sourceCardId]
          )
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
            }
          },
          where: {
            id: card.id
          }
        });
      })
      .filter(isTruthy)
  );
}
