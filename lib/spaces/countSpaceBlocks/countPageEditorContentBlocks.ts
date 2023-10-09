import type { Page } from '@charmverse/core/prisma';

import { countBlocks } from 'lib/prosemirror/countBlocks';
import { defaultPaginatedPrismaTaskBatchSize, paginatedPrismaTask } from 'lib/utilities/paginatedPrismaTask';

import type { BlocksCountQuery } from './interfaces';

export async function countPageEditorContentBlocks({
  spaceId,
  batchSize = defaultPaginatedPrismaTaskBatchSize
}: BlocksCountQuery): Promise<number> {
  const documentBlocks = (
    await paginatedPrismaTask({
      model: 'page',
      batchSize,
      queryOptions: {
        where: {
          spaceId
        },
        select: {
          id: true,
          content: true
        }
      },
      callback: (pages: Pick<Page, 'content' | 'id'>[]) => {
        return pages.map((page) => countBlocks(page.content, { pageId: page.id, spaceId })).reduce((a, b) => a + b, 0);
      }
    })
  ).reduce((a, b) => a + b, 0);

  return documentBlocks;
}
