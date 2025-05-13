import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { banMember } from '@packages/lib/members/banMember';
import { onError, onNoMatch, requireSpaceMembership } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' })).delete(banMemberHandler);

async function banMemberHandler(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.query.userId as string;
  const spaceId = req.query.id as string;

  await banMember({
    spaceId,
    userId
  });

  res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
