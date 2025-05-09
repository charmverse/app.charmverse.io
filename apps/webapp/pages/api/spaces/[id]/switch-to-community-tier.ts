import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { updateToCommunityTier } from '@packages/lib/subscription/updateToCommunityTier';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(
    requireSpaceMembership({
      adminOnly: true,
      spaceIdKey: 'id'
    })
  )
  .post(switchToFreeTier);

async function switchToFreeTier(req: NextApiRequest, res: NextApiResponse<void>) {
  const spaceId = req.query.id as string;
  const userId = req.session.user.id;

  await updateToCommunityTier(spaceId, userId);

  res.status(200).end();
}

export default withSessionRoute(handler);
