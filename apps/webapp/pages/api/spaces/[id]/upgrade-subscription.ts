import { log } from '@charmverse/core/log';
import { onError, onNoMatch, requireKeys, requireSpaceMembership, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { UpgradeSubscriptionRequest } from '@packages/lib/subscription/upgradeProSubscription';
import { upgradeProSubscription } from '@packages/lib/subscription/upgradeProSubscription';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .use(requireKeys(['period', 'blockQuota'], 'body'))
  .put(upgradeSubscription);

async function upgradeSubscription(req: NextApiRequest, res: NextApiResponse<void>) {
  const { id: spaceId } = req.query as { id: string };
  const userId = req.session.user.id;
  const payload = req.body as UpgradeSubscriptionRequest;

  await upgradeProSubscription({ spaceId, payload });

  log.info(`Subscription upgraded/downgraded for space ${spaceId} by user ${userId}`);

  res.status(200).end();
}

export default withSessionRoute(handler);
