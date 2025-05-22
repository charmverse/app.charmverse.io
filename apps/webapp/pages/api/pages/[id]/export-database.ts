import { log } from '@charmverse/core/log';
import { generateMarkdown } from '@packages/bangleeditor/markdown/generateMarkdown';
import type { FilterGroup } from '@packages/databases/filterGroup';
import { loadAndGenerateCsv } from '@packages/databases/generateCsv';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { ContentToCompress, MarkdownPageToCompress } from '@packages/lib/utils/file';
import { zipContent } from '@packages/lib/utils/file';
import { paginatedPrismaTask } from '@packages/lib/utils/paginatedPrismaTask';
import { DataNotFoundError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(requestZip);

export type ZippedDataRequest = Pick<ContentToCompress, 'csv'> & { pageIds: string[] };

async function requestZip(req: NextApiRequest, res: NextApiResponse) {
  const pageId = req.query.id as string;
  const customFilter = req.query.filter as string;
  const viewId = req.query.viewId as string;

  let filter = null;
  if (customFilter) {
    try {
      filter = JSON.parse(customFilter) as FilterGroup;
    } catch (err) {
      log.warn('Could not parse filter when exporting database', { error: err, filter: customFilter });
    }
  }
  const computed = await permissionsApiClient.pages.computePagePermissions({
    resourceId: pageId,
    userId: req.session.user?.id
  });

  if (computed.read !== true) {
    throw new DataNotFoundError('No such page exists');
  }

  const csvData = await loadAndGenerateCsv({
    userId: req.session.user.id,
    databaseId: pageId,
    customFilter: filter,
    viewId
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
