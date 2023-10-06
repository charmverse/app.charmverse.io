import { prisma } from '@charmverse/core/prisma-client';

import type { Board, IPropertyTemplate } from 'lib/focalboard/board';
import type { Card } from 'lib/focalboard/card';
import { countBlocks } from 'lib/prosemirror/countBlocks';
import { paginatedPrismaTask } from 'lib/utilities/paginatedPrismaTask';

export async function countSpaceDatabaseBlockContentAndProps({ spaceId }: { spaceId: string }): Promise<number> {
  const databaseBlockRecords = await prisma.block.findMany({
    where: {
      type: 'board',
      spaceId
    },
    select: {
      id: true,
      fields: true
    }
  });

  const databaseBlockDescriptionCounts = databaseBlockRecords
    .map((board) => countBlocks((board.fields as any)?.description, { blockId: board.id, spaceId }))
    .reduce((a, b) => a + b, 0);

  const databaseSchemas = databaseBlockRecords.reduce((acc, block) => {
    const boardProps = (block as any as Board).fields.cardProperties?.reduce((propAcc, prop) => {
      propAcc[prop.id] = prop;
      return propAcc;
    }, {} as Record<string, IPropertyTemplate>);
    acc[block.id] = boardProps;
    return acc;
  }, {} as Record<string, Record<string, IPropertyTemplate>>);

  const cardPropValues = await paginatedPrismaTask({
    batchSize: 2,
    model: 'block',
    queryOptions: {
      where: {
        spaceId,
        type: 'card'
      },
      select: {
        rootId: true,
        fields: true
      }
    },
    callback: (cards: Pick<Card, 'fields' | 'rootId'>[]) => {
      return cards.reduce((acc, card) => {
        const cardProps = Object.entries(card.fields.properties ?? {});
        const cardPropCounts: number = cardProps.reduce((cardPropAcc, [propId, propValue]) => {
          if (
            !propValue ||
            (Array.isArray(propValue) && !propValue.length) ||
            !databaseSchemas[card.rootId]?.[propId]
          ) {
            return acc;
          }
          return acc;
        }, 0);

        return acc;
      }, 0);
    }
  });
}
