import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { createProSubscription } from 'lib/subscription/createProSubscription';
import type { SpaceSubscription } from 'lib/subscription/getSpaceSubscription';
import { getSpaceSubscription } from 'lib/subscription/getSpaceSubscription';
import type { CreatePaymentSubscriptionResponse, CreateSubscriptionRequest } from 'lib/subscription/interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(
    requireSpaceMembership({
      adminOnly: false,
      spaceIdKey: 'id'
    })
  )
  .get(getSpaceSubscriptionController)
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .post(createPaymentSubscription);

async function getSpaceSubscriptionController(req: NextApiRequest, res: NextApiResponse<SpaceSubscription | null>) {
  const { id: spaceId } = req.query as { id: string };

  const spaceSubscription = await getSpaceSubscription({
    spaceId
  });

  return res.status(200).json(spaceSubscription);
}

async function createPaymentSubscription(req: NextApiRequest, res: NextApiResponse<CreatePaymentSubscriptionResponse>) {
  const { id: spaceId } = req.query as { id: string };
  const { period, productId, billingEmail, name, address, coupon } = req.body as CreateSubscriptionRequest;

  const userId = req.session.user.id;
  const { clientSecret, paymentIntentStatus } = await createProSubscription({
    spaceId,
    period,
    productId,
    billingEmail,
    name,
    address,
    coupon
  });

  trackUserAction('checkout_subscription', {
    userId,
    spaceId,
    billingEmail,
    productId,
    period,
    tier: 'pro',
    result: paymentIntentStatus === 'succeeded' ? 'success' : 'pending'
  });

  res.status(200).json({
    paymentIntentStatus,
    clientSecret
  });
}

export default withSessionRoute(handler);
