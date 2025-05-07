import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { updateToFreeTier } from '@packages/lib/subscription/updateToFreeTier';

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

  await updateToFreeTier(spaceId, userId);

  res.status(200).end();
}

export default withSessionRoute(handler);
