
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
  const pages: IPageWithPermissions[] = [];
  const { pageIds } = req.body as {pageIds: string[]};

  for (const pageId of pageIds) {
    const page = await getPage(pageId, spaceId);
    if (page) {
      const permissions = await computeUserPagePermissions({
        pageId,
        userId
      });
      if (permissions.read) {
        pages.push(page);
      }
    }
  }

  return res.status(200).json(pages);
}

export default withSessionRoute(handler);
