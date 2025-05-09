/* eslint-disable no-console */

import { Block } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { BoardView } from '@packages/databases/boardView';
import { FilterClause, FilterCondition } from '@packages/databases/filterClause';
import { v4 } from 'uuid';

// use this file and run against production to generate api keys

(async () => {
  const viewBlocks = (await prisma.block.findMany({
    where: {
      type: 'view'
    },
    select: {
      fields: true,
      id: true
    }
  })) as Block[];

  const viewsWithFilter = viewBlocks.filter(
    (block) => (block.fields as any)?.filter?.filters.length > 0
  ) as unknown as BoardView[];

  for (const viewWithFilter of viewsWithFilter) {
    const updatedFilters = viewWithFilter.fields.filter.filters.map((filter) => {
      const condition = (filter as FilterClause).condition as string;
      let transformedCondition: FilterCondition = 'contains';
      if (condition === 'includes') {
        transformedCondition = 'contains';
      } else if (condition === 'notIncludes') {
        transformedCondition = 'does_not_contain';
      } else if (condition === 'isNotEmpty') {
        transformedCondition = 'is_not_empty';
      } else if (condition === 'isEmpty') {
        transformedCondition = 'is_empty';
      }
      return { ...filter, condition: transformedCondition, filterId: v4() };
    });
    await prisma.block.update({
      where: {
        id: viewWithFilter.id
      },
      data: {
        fields: {
          ...viewWithFilter.fields,
          filter: {
            operation: viewWithFilter.fields.filter.operation,
            filters: updatedFilters
          }
        }
      }
    });
  }
})();
