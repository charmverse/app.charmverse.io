import { prisma } from '@charmverse/core/prisma-client';
import type { Board, IPropertyTemplate } from '@root/lib/databases/board';
import type { Card } from '@root/lib/databases/card';
import { countBlocks } from '@root/lib/prosemirror/countBlocks';
import { paginatedPrismaTask } from '@root/lib/utils/paginatedPrismaTask';
import _sum from 'lodash/sum';

import type { BlocksCountQuery, GenericBlocksCount } from './interfaces';

export type DetailedDatabaseBlocksCount = {
  databaseViews: number;
  databaseDescriptions: number;
  databaseProperties: number;
  databaseRowPropValues: number;
};

export type DatabaseBlocksCount = GenericBlocksCount<DetailedDatabaseBlocksCount>;

export async function countDatabaseBlockContentAndProps({ spaceId }: BlocksCountQuery): Promise<DatabaseBlocksCount> {
  const detailedCount: DatabaseBlocksCount = {
    total: 0,
    details: {
      databaseViews: 0,
      databaseDescriptions: 0,
      databaseProperties: 0,
      databaseRowPropValues: 0
    }
  };

  // 1 - Count views
  detailedCount.details.databaseViews = await prisma.block.count({
    where: { spaceId, type: 'view', deletedAt: null }
  });

  const databaseBlockRecords = await prisma.block.findMany({
    where: {
      type: 'board',
      spaceId,
      deletedAt: null
    },
    select: {
      id: true,
      fields: true
    }
  });

  // 2 - Count database block descriptions
  const databaseBlockDescriptionCounts = databaseBlockRecords
    .map((board) => countBlocks((board.fields as any)?.description, { blockId: board.id, spaceId }))
    .reduce((a, b) => a + b, 0);

  detailedCount.details.databaseDescriptions = databaseBlockDescriptionCounts;

  // 3 - Get schemas for each database block and sum up
  let totalProperties = 0;

  const databaseSchemas = databaseBlockRecords.reduce(
    (acc, block) => {
      // Create a local map for this database
      const boardProps = (block as any as Board).fields.cardProperties?.reduce(
        (propAcc, prop) => {
          totalProperties += 1;
          propAcc[prop.id] = prop;
          return propAcc;
        },
        {} as Record<string, IPropertyTemplate>
      );
      acc[block.id] = boardProps;
      return acc;
    },
    {} as Record<string, Record<string, IPropertyTemplate>>
  );

  detailedCount.details.databaseProperties = totalProperties;

  const cardPropValues = await paginatedPrismaTask({
    batchSize: 2,
    model: 'block',
    queryOptions: {
      where: {
        spaceId,
        type: 'card',
        deletedAt: null
      },
      select: {
        id: true,
        rootId: true,
        fields: true
      }
    },
    onSuccess: _sum,
    mapper: (card: Pick<Card, 'fields' | 'rootId'>) => {
      const cardProps = Object.entries(card.fields.properties ?? {});
      return cardProps.reduce((cardPropAcc, [propId, propValue]) => {
        const matchingSchema = databaseSchemas[card.rootId]?.[propId];
        if (
          // Edge case for number type fields
          (!propValue && propValue !== 0) ||
          (Array.isArray(propValue) && !propValue.length) ||
          !matchingSchema
        ) {
          return cardPropAcc;
        }
        return cardPropAcc + 1;
      }, 0);
    }
  });

  detailedCount.details.databaseRowPropValues = cardPropValues;

  // Summing up all counts

  detailedCount.total = _sum(Object.values(detailedCount.details));

  return detailedCount;
}
