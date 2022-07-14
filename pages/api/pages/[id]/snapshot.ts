
import { Page } from '@prisma/client';
import { prisma } from 'db';
import { hasAccessToSpace, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { getPage, IPageWithPermissions } from 'lib/pages/server';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError } from 'lib/utilities/errors';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireKeys<Page>(['snapshotProposalId'], 'body'))
  .put(recordSnapshotInfo);

async function recordSnapshotInfo (req: NextApiRequest, res: NextApiResponse<IPageWithPermissions>) {

  const { snapshotProposalId } = req.body;

  const pageId = req.query.id as string;

  const page = await getPage(pageId);

  if (!page) {
    throw new DataNotFoundError();
  }

  const { error } = await hasAccessToSpace({
    spaceId: page.spaceId as string,
    userId: req.session.user.id
  });

  if (error) {
    throw error;
  }

  const updatedPage = await prisma.page.update({
    where: {
      id: pageId
    },
    data: {
      snapshotProposalId
    },
    include: {
      permissions: {
        include: {
          sourcePermission: true
        }
      }
    }
  });

  res.status(200).json(updatedPage);

}

export default withSessionRoute(handler);
