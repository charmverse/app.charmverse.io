import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { removeMember } from '@packages/lib/members/removeMember';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(leaveWorkspace);

async function leaveWorkspace(req: NextApiRequest, res: NextApiResponse<{ ok: boolean }>) {
  const spaceId = req.query.id as string;
  const userId = req.session.user.id;

  await removeMember({
    spaceId,
    userId
  });
  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
