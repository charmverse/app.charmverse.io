import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { acceptInvite } from '@packages/lib/invites/acceptInvite';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(acceptInviteController);

async function acceptInviteController(req: NextApiRequest, res: NextApiResponse) {
  await acceptInvite({
    inviteLinkId: req.query.id as string,
    userId: req.session.user.id
  });
  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
