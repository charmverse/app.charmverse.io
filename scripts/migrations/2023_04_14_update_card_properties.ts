/* eslint-disable no-console */

import { Block } from '@prisma/client';
import { prisma } from 'db';
import { prismaToBlock } from 'lib/focalboard/block';
import { Board } from 'lib/focalboard/board';
import { BoardView } from 'lib/focalboard/boardView';
import { Card } from 'lib/focalboard/card';
import { v4 } from 'uuid';

// use this file and run against production to generate api keys

(async () => {
  const viewBlocks = (await prisma.block.findMany({
    where: {
      type: "view",
    },
    select: {
      fields: true,
      id: true
    }
  }) as Block[])

  const viewsWithFilter = viewBlocks.filter(block => (block.fields as any)?.filter?.filters.length > 0) as unknown as BoardView[]
  for (const viewWithFilter of viewsWithFilter) {
    const updatedFilters = viewWithFilter.fields.filter.filters.map(filter => ({...filter, filterId: v4()}))
    await prisma.block.update({
      where: {
        id: viewWithFilter.id
      },
      data: {
        fields: {
          ...viewWithFilter.fields,
          filter: {
            operation: "and",
            filters: updatedFilters
          }
        }
      }
    })
  }

})();
