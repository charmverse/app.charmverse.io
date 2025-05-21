import { onError, onNoMatch, requireSpaceMembership, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { SpaceSubscriptionStatus } from '@packages/subscriptions/getSubscriptionStatus';
import { getSubscriptionStatus } from '@packages/subscriptions/getSubscriptionStatus';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .get(getSubscriptionStatusController);

async function getSubscriptionStatusController(req: NextApiRequest, res: NextApiResponse<SpaceSubscriptionStatus>) {
  const { id: spaceId } = req.query as { id: string };

  const result = await getSubscriptionStatus(spaceId);
  res.status(200).json(result);
}

export default withSessionRoute(handler);
