import { exportProposals } from '@packages/lib/proposals/exportProposals';
import type { ContentToCompress, MarkdownPageToCompress } from '@packages/lib/utils/file';
import { paginatedPrismaTask } from '@packages/lib/utils/paginatedPrismaTask';

import { exportPages } from './exportPages';
import { zipFiles } from './zipFiles';

export type ZippedDataRequest = Pick<ContentToCompress, 'csv'> & { pageIds: string[] };

// const markdownPages = await paginatedPrismaTask({
//   model: 'page',
//   mapper: async (page) => {
//     const markdown = await generateMarkdown({
//       content: page.content
//     }).catch((err) => {
//       log.error('Error generating markdown', { pageId: page.id, error: err });
//       return 'Error generating markdown for this page';
//     });

//     return {
//       title: page.title || 'Untitled',
//       contentMarkdown: markdown ?? ''
//     } as MarkdownPageToCompress;
//   },
//   queryOptions: {
//     where: {
//       id: {
//         in: accessiblePageIds
//       }
//     },
//     select: {
//       id: true,
//       title: true,
//       content: true
//     }
//   }
// });
export async function createDataExport({ userId, spaceId }: { userId: string; spaceId: string }) {
  const pages = []; // await exportPages({ spaceId });
  const proposalsTsv = await exportProposals({ spaceId, userId });
  const compressed = await zipFiles([
    {
      title: 'Proposals',
      tsv: proposalsTsv
    },
    {
      title: 'pages',
      children: pages.map((page) => ({
        title: page.title,
        content: page.content
      }))
    }
  ]);

  return compressed;
}
