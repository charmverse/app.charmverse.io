import { encryptData } from '@packages/utils/dataEncryption';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' })).get(getStateHandler);

async function getStateHandler(req: NextApiRequest, res: NextApiResponse<{ code: string }>) {
  const { id: spaceId } = req.query as { id: string };
  const userId = req.session.user.id;

  const code = encryptData({ spaceId, userId });

  return res.status(200).json({ code });
}

export default withSessionRoute(handler);
