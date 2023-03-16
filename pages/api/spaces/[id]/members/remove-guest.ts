import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { removeMember } from 'lib/members/removeMember';
import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(
    requireSpaceMembership({
      adminOnly: true,
      spaceIdKey: 'id'
    })
  )
  .post(removeMemberController);

async function removeMemberController(req: NextApiRequest, res: NextApiResponse) {
  const spaceId = req.query.id as string;
  const userId = req.body.userId;

  await removeMember({
    spaceId,
    userId
  });

  return res.status(200).json({ success: true });
}

export default withSessionRoute(handler);
