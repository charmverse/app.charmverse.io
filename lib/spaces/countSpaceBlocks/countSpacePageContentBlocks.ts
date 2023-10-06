import type { Page } from '@charmverse/core/prisma';

import { countBlocks } from 'lib/prosemirror/countBlocks';
import { paginatedPrismaTask } from 'lib/utilities/paginatedPrismaTask';

export async function countSpacePageContent({ spaceId }: { spaceId: string }): Promise<number> {
  const documentBlocks = (
    await paginatedPrismaTask({
      model: 'page',
      batchSize: 500,
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
