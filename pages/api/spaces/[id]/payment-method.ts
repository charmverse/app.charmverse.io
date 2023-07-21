import { log } from '@charmverse/core/log';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { NotFoundError, onError, onNoMatch, requireKeys, requireSpaceMembership, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import type { SubscriptionPeriod } from 'lib/subscription/constants';
import { getActiveSpaceSubscription } from 'lib/subscription/getActiveSpaceSubscription';
import { updatePaymentMethod } from 'lib/subscription/updatePaymentMethod';

export type UpgradeSubscriptionRequest = {
  blockQuota: number;
  period: SubscriptionPeriod;
};

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .use(requireKeys(['paymentMethodId'], 'body'))
  .put(upgradeSubscription);

async function upgradeSubscription(req: NextApiRequest, res: NextApiResponse<void>) {
  const { id: spaceId } = req.query as { id: string };
  const userId = req.session.user.id;
  const paymentMethodId = req.body.paymentMethodId as string;

  const subscriptionData = await getActiveSpaceSubscription({ spaceId });

  if (!subscriptionData) {
    throw new NotFoundError(`Subscription not found for space ${spaceId}`);
  }

  await updatePaymentMethod({
    customerId: subscriptionData.customerId,
    subscriptionId: subscriptionData.subscriptionId,
    paymentMethodId
  });

  log.info(`Change payment method for subscription has been initialised for space ${spaceId} by the user ${userId}`);

  res.status(200).end();
}

export default withSessionRoute(handler);
