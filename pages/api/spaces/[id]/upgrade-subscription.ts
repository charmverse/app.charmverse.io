import { log } from '@charmverse/core/log';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireSpaceMembership, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import type { SubscriptionPeriod } from 'lib/subscription/constants';
import { upgradeProSubscription } from 'lib/subscription/upgradeProSubscription';

export type UpgradeSubscriptionRequest = {
  blockQuota: number;
  period: SubscriptionPeriod;
};

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
