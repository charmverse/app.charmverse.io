import type { Prisma } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import log from 'lib/log';
import { onError, onNoMatch } from 'lib/middleware';
import type { PageMeta } from 'lib/pages/server';
import { getAccessiblePages } from 'lib/pages/server';
import { createPage } from 'lib/pages/server/createPage';
import { untitledPage } from 'lib/pages/untitledPage';
import { setupPermissionsAfterPageCreated } from 'lib/permissions/pages';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getPages);

async function getPages(req: NextApiRequest, res: NextApiResponse<PageMeta[]>) {
  const spaceId = req.query.id as string;
  const archived = req.query.archived === 'true';
  const userId = req.session?.user?.id;
  const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : undefined;
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;

  const accessiblePages = await getAccessiblePages({
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

      await setupPermissionsAfterPageCreated(createdPage.id);
      createdPages.push(createdPage);
      log.warn(`Created default first page for space ${spaceId}`, { spaceId, userId });
    }
  }

  return res.status(200).json([...accessiblePages, ...createdPages]);
}

export default withSessionRoute(handler);
