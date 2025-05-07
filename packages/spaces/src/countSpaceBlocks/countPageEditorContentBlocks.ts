import type { Page } from '@charmverse/core/prisma';
import { defaultPaginatedPrismaTaskBatchSize, paginatedPrismaTask } from '@packages/lib/utils/paginatedPrismaTask';
import _sum from 'lodash/sum';

import { countBlocks } from 'lib/prosemirror/countBlocks';

import type { BlocksCountQuery } from './interfaces';

export async function countPageEditorContentBlocks({
  spaceId,
  batchSize = defaultPaginatedPrismaTaskBatchSize
}: BlocksCountQuery): Promise<number> {
  const documentBlocks = await paginatedPrismaTask({
    model: 'page',
    batchSize,
    queryOptions: {
      where: {
        spaceId,
        deletedAt: null
      },
      select: {
        id: true,
        content: true
      }
    },
    onSuccess: _sum,
    mapper: (page: Pick<Page, 'content' | 'id'>) => {
      return countBlocks(page.content, { pageId: page.id, spaceId });
    }
  });

  return documentBlocks;
}
