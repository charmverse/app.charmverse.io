import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { removeGuest } from 'lib/roles/removeGuest';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(
    requireSpaceMembership({
      adminOnly: true,
      spaceIdKey: 'id'
    })
  )
  .post(removeGuestController);

async function removeGuestController(req: NextApiRequest, res: NextApiResponse) {
  const spaceId = req.query.id as string;
  const userId = req.body.userId;

  await removeGuest({
    spaceId,
    userId
  });

  return res.status(200).json({ success: true });
}

export default withSessionRoute(handler);
