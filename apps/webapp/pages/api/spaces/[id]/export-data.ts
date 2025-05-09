import { log } from '@charmverse/core/log';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from '@packages/lib/middleware';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { generateMarkdown } from 'lib/prosemirror/markdown/generateMarkdown';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { ContentToCompress, MarkdownPageToCompress } from '@packages/lib/utils/file';
import { zipContent } from '@packages/lib/utils/file';
import { paginatedPrismaTask } from '@packages/lib/utils/paginatedPrismaTask';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(requestZip);

export type ZippedDataRequest = Pick<ContentToCompress, 'csv'> & { pageIds: string[] };

async function requestZip(req: NextApiRequest, res: NextApiResponse) {
  const pageIdsToExport: string[] = req.body.pageIds ?? [];

  const accessiblePageIds = await permissionsApiClient.pages
    .bulkComputePagePermissions({
      pageIds: pageIdsToExport,
      userId: req.session.user.id
    })
    .then((permissions) => pageIdsToExport.filter((id) => !!permissions[id]?.read));

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

  const compressed = await zipContent({ csv: req.body.csv ?? [], pages: markdownPages });

  return res.status(200).setHeader('Content-Type', 'application/octet-stream').send(compressed);
}

export default withSessionRoute(handler);
