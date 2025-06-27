import { log } from '@packages/core/log';
import { onError, onNoMatch, requireSpaceMembership, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { type UpgradeSubscriptionRequest, upgradeSubscription } from '@packages/subscriptions/upgradeSubscription';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .post(upgradeSubscriptionController);

async function upgradeSubscriptionController(req: NextApiRequest, res: NextApiResponse<string>) {
  const { id: spaceId } = req.query as { id: string };
  const userId = req.session.user.id;

  await upgradeSubscription({
    ...(req.body as UpgradeSubscriptionRequest),
    spaceId,
    userId
  });

  log.info(`[charmverse-payments] Recorded subscription upgrade`, {
    newTier: req.body.newTier,
    userId,
    spaceId
  });

  res.status(200).end();
}

export default withSessionRoute(handler);
