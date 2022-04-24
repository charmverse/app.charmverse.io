
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { deleteNestedChild } from 'lib/api/deleteNestedChild';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).delete(deleteBlock);

async function deleteBlock (req: NextApiRequest, res: NextApiResponse<{deletedCount: number} | {error: string}>) {
  return res.status(200).json({ deletedCount: (await deleteNestedChild(req.query.id as string, req.session.user.id)).length });
}

export default withSessionRoute(handler);
