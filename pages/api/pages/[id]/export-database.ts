import { log } from '@charmverse/core/log';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { loadAndGenerateCsv } from 'lib/focalboard/generateCsv';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { generateMarkdown } from 'lib/prosemirror/plugins/markdown/generateMarkdown';
import { withSessionRoute } from 'lib/session/withSession';
import type { ContentToCompress, MarkdownPageToCompress } from 'lib/utilities/file';
import { zipContent } from 'lib/utilities/file';
import { paginatedPrismaTask } from 'lib/utilities/paginatedPrismaTask';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(requestZip);

export type ZippedDataRequest = Pick<ContentToCompress, 'csv'> & { pageIds: string[] };

async function requestZip(req: NextApiRequest, res: NextApiResponse) {
  const pageId = req.query.id as string;

  const csvData = await loadAndGenerateCsv({
    userId: req.session.user.id,
    databaseId: pageId
  });

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
          in: csvData.childPageIds
        }
      },
      select: {
        id: true,
        title: true,
        content: true
      }
    }
  });

  const compressed = await zipContent({
    csv: [{ content: `${csvData.csvData}`, title: 'database-export' }],
    pages: markdownPages
  });

  return res.status(200).setHeader('Content-Type', 'application/octet-stream').send(compressed);
}

export default withSessionRoute(handler);
