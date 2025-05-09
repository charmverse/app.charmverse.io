import { log } from '@charmverse/core/log';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireSpaceMembership, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { createProSubscription } from '@packages/lib/subscription/createProSubscription';
import { deleteProSubscription } from '@packages/lib/subscription/deleteProSubscription';
import type { SpaceSubscriptionWithStripeData } from '@packages/lib/subscription/getActiveSpaceSubscription';
import { getActiveSpaceSubscription } from '@packages/lib/subscription/getActiveSpaceSubscription';
import type { CreateProSubscriptionRequest, SubscriptionPaymentIntent } from '@packages/lib/subscription/interfaces';
import type { UpdateSubscriptionRequest } from '@packages/lib/subscription/updateProSubscription';
import { updateProSubscription } from '@packages/lib/subscription/updateProSubscription';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }), getSpaceSubscriptionController)
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .delete(deletePaymentSubscription)
  .put(updatePaymentSubscription)
  .post(requireKeys(['period', 'blockQuota', 'billingEmail'], 'body'), createPaymentSubscription);

async function getSpaceSubscriptionController(
  req: NextApiRequest,
  res: NextApiResponse<SpaceSubscriptionWithStripeData | null>
) {
  const { id: spaceId } = req.query as { id: string };

  const spaceSubscription = await getActiveSpaceSubscription({ spaceId });

  return res.status(200).json(spaceSubscription);
}

async function createPaymentSubscription(
  req: NextApiRequest,
  res: NextApiResponse<SubscriptionPaymentIntent & { email?: string }>
) {
  const { id: spaceId } = req.query as { id: string };
  const userId = req.session.user.id;
  const { period, blockQuota, billingEmail, name, address, coupon } = req.body as CreateProSubscriptionRequest;

  const { paymentIntent, email } = await createProSubscription({
    spaceId,
    period,
    blockQuota,
    billingEmail,
    name,
    address,
    coupon
  });

  log.info(`Subscription creation process started for space ${spaceId} by user ${userId}`);

  res.status(200).json({ ...(paymentIntent || ({} as SubscriptionPaymentIntent)), email });
}

async function deletePaymentSubscription(req: NextApiRequest, res: NextApiResponse<void>) {
  const { id: spaceId } = req.query as { id: string };

  const userId = req.session.user.id;

  await deleteProSubscription({ spaceId, userId });

  log.info(`Subscription cancelled for space ${spaceId} by user ${userId}`);

  res.status(200).end();
}

async function updatePaymentSubscription(req: NextApiRequest, res: NextApiResponse<void>) {
  const { id: spaceId } = req.query as { id: string };
  const userId = req.session.user.id;
  const { billingEmail, status } = req.body as UpdateSubscriptionRequest;

  await updateProSubscription({ spaceId, payload: { billingEmail, status } });

  log.info(`Subscription updated for space ${spaceId} by user ${userId}`);

  res.status(200).end();
}

export default withSessionRoute(handler);
