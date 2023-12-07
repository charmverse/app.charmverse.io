import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { togglePrimaryIdentity } from 'lib/members/togglePrimaryIdentity';
import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' })).put(togglePrimaryIdentityHandler);

async function togglePrimaryIdentityHandler(req: NextApiRequest, res: NextApiResponse) {
  await togglePrimaryIdentity({
    propertyId: req.query.propertyId as string,
    toggle: req.body.toggle
  });
  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
