
import { ActionNotPermittedError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { withSessionRoute } from 'lib/session/withSession';
import { prisma } from 'db';
import { modifyChildPages } from 'lib/pages/modifyChildPages';
import { ModifyChildPagesResponse } from 'lib/pages';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireKeys(['archive'], 'body'))
  .put(togglePageArchiveStatus);

async function togglePageArchiveStatus (req: NextApiRequest, res: NextApiResponse<ModifyChildPagesResponse>) {
  const pageId = req.query.id as string;
  const { archive } = req.body as {archive: boolean};
  const userId = req.session.user.id;

  const permissions = await computeUserPagePermissions({
    pageId,
    userId
  });

  if (permissions.delete !== true) {
    throw new ActionNotPermittedError('You are not allowed to delete this page.');
  }

  const rootBlock = await prisma.block.findUnique({
    where: {
      id: pageId
    }
  });

  const modifiedChildPageIds = await modifyChildPages(pageId, userId, archive ? 'archive' : 'restore');

  return res.status(200).json({ pageIds: modifiedChildPageIds, rootBlock });
}

export default withSessionRoute(handler);
