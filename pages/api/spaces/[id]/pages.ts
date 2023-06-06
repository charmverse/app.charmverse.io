import { log } from '@charmverse/core/log';
import type { PageMeta } from '@charmverse/core/pages';
import type { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import { createPage } from 'lib/pages/server/createPage';
import { untitledPage } from 'lib/pages/untitledPage';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(
    providePermissionClients({
      key: 'id',
      location: 'query',
      resourceIdType: 'space'
    })
  )
  .get(getPages);

async function getPages(req: NextApiRequest, res: NextApiResponse<PageMeta[]>) {
  const spaceId = req.query.id as string;
  const archived = req.query.archived === 'true';
  const userId = req.session?.user?.id;
  const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : undefined;
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;

  const accessiblePages = await req.basePermissionsClient.pages.getAccessiblePages({
    spaceId,
    userId,
    archived,
    limit,
    search
  });

  const createdPages: PageMeta[] = [];

  if (accessiblePages.length === 0 && !search) {
    const totalPages = await prisma.page.count({
      where: {
        spaceId
      }
    });

    if (totalPages === 0) {
      const createdPage = await createPage({
        data: untitledPage({
          userId,
          spaceId
        }) as Prisma.PageUncheckedCreateInput
      });

      await req.premiumPermissionsClient.pages.setupPagePermissionsAfterEvent({
        event: 'created',
        pageId: createdPage.id
      });

      createdPages.push(createdPage);
      log.warn(`Created default first page for space ${spaceId}`, { spaceId, userId });
    }
  }

  return res.status(200).json([...accessiblePages, ...createdPages]);
}

export default withSessionRoute(handler);
