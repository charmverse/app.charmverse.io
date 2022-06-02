
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { Page } from '@prisma/client';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import { getPage, IPageWithPermissions } from 'lib/pages/server';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(getPagesByIds);

async function getPagesByIds (req: NextApiRequest, res: NextApiResponse<Page[]>) {
  const spaceId = req.query.id as string;
  const userId = req.session?.user?.id;
  const { pageIds } = req.body as {pageIds: string[]};

  const pages = (await Promise.all(pageIds.map((pageId) => new Promise<IPageWithPermissions | null>((resolve) => {
    getPage(pageId, spaceId).then((page) => {
      computeUserPagePermissions({
        pageId,
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
    }).catch(() => {
      resolve(null);
    });
  })))).filter(page => page) as IPageWithPermissions[];

  return res.status(200).json(pages);
}

export default withSessionRoute(handler);
