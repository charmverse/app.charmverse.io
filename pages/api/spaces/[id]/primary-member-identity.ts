import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { updateSpacePrimaryMemberIdentity } from 'lib/spaces/updateSpacePrimaryMemberIdentity';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' })).put(updateSpacePrimaryMemberIdentityHandler);

async function updateSpacePrimaryMemberIdentityHandler(req: NextApiRequest, res: NextApiResponse) {
  await updateSpacePrimaryMemberIdentity({
    spaceId: req.query.id as string,
    primaryMemberIdentity: req.body.primaryMemberIdentity
  });
  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
