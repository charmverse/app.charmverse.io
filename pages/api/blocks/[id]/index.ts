
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { deleteNestedChild } from 'lib/api/deleteNestedChild';
import { computeUserPagePermissions } from 'lib/permissions/pages/page-permission-compute';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).delete(deleteBlock);

async function deleteBlock (req: NextApiRequest, res: NextApiResponse<{deletedCount: number} | {error: string}>) {
  const pageId = req.query.id as string;
  const userId = req.session.user.id as string;

  const permissionsSet = await computeUserPagePermissions({
    pageId: req.query.id as string,
    userId: req.session.user.id as string
  });

  if (!permissionsSet.delete) {
    return res.status(401).json({
      error: 'You are not allowed to perform this action'
    });
  }
  return res.status(200).json({ deletedCount: (await deleteNestedChild(pageId, userId)).length });
}

export default withSessionRoute(handler);
