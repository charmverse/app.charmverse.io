
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { Page } from '@prisma/client';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import { IPageWithPermissions } from 'lib/pages/server';
import { prisma } from 'db';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(getPagesByIds);

async function getPagesByIds (req: NextApiRequest, res: NextApiResponse<Page[]>) {
  const userId = req.session?.user?.id;
  const { pageIds } = req.body as {pageIds: string[]};
  const pages = await prisma.page.findMany({
    where: {
      id: {
        in: pageIds
      }
    },
    include: {
      permissions: {
        include: {
          sourcePermission: true
        }
      }
    }
  });

  const accessiblePages = (await Promise.all(pages.map((page) => new Promise<IPageWithPermissions | null>((resolve) => {
    computeUserPagePermissions({
      pageId: page.id,
      userId
    }).then((permissions) => {
      if (permissions.read) {
        resolve(page);
      }
      else {
        resolve(null);
      }
    }).catch(() => {
      resolve(null);
    });
  })))).filter(page => page) as IPageWithPermissions[];

  return res.status(200).json(accessiblePages);
}

export default withSessionRoute(handler);
