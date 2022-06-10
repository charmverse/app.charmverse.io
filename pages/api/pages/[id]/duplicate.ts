import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { duplicatePage } from 'lib/pages/server/duplicatePage';
import { IPageWithPermissions } from 'lib/pages/server';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .post(duplicatePageRoute);

async function duplicatePageRoute (req: NextApiRequest, res: NextApiResponse<IPageWithPermissions>) {
  const pageId = req.query.id as string;
  const userId = req.session.user.id;
  const { parentId } = req.body as {parentId: string};

  const permissions = await computeUserPagePermissions({
    pageId,
    userId
  });

  if (permissions.edit_content !== true) {
    throw new ActionNotPermittedError('You are not allowed to edit this page.');
  }

  const pageWithPermissions = await duplicatePage(pageId, userId, parentId);

  return res.status(200).json(pageWithPermissions);
}

export default withSessionRoute(handler);
