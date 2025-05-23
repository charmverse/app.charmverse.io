import { log } from '@charmverse/core/log';
import { generateMarkdown } from '@packages/bangleeditor/markdown/generateMarkdown';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { ContentToCompress, MarkdownPageToCompress } from '@packages/lib/utils/file';
import { paginatedPrismaTask } from '@packages/lib/utils/paginatedPrismaTask';

import { exportWorkspacePages } from './exportWorkspacePages';

export type ZippedDataRequest = Pick<ContentToCompress, 'csv'> & { pageIds: string[] };

export async function requestZip({ userId, spaceId }: { userId: string; spaceId: string }) {
  const { pages } = await exportWorkspacePages({ sourceSpaceIdOrDomain: spaceId });

  const markdownPages = await paginatedPrismaTask({
    model: 'page',
    mapper: async (page) => {
      const markdown = await generateMarkdown({
        content: page.content
      }).catch((err) => {
        log.error('Error generating markdown', { pageId: page.id, error: err });
        return 'Error generating markdown for this page';
      });

      return {
        title: page.title || 'Untitled',
        contentMarkdown: markdown ?? ''
      } as MarkdownPageToCompress;
    },
    queryOptions: {
      where: {
        id: {
          in: accessiblePageIds
        }
      },
      select: {
        id: true,
        title: true,
        content: true
      }
    }
  });
}
