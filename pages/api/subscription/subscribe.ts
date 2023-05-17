import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import type {
  CreateProSubscriptionRequest,
  CreateProSubscriptionResponse
} from 'lib/subscription/createProSubscription';
import { createProSubscription } from 'lib/subscription/createProSubscription';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'spaceId' }))
  .post(createPaymentSubscription);

async function createPaymentSubscription(req: NextApiRequest, res: NextApiResponse<CreateProSubscriptionResponse>) {
  const { period, usage, paymentMethodId, spaceId, billingEmail, fullName, streetAddress } =
    req.body as CreateProSubscriptionRequest;

  const userId = req.session.user.id;
  const { clientSecret, paymentIntentStatus, subscriptionId } = await createProSubscription({
    userId,
    paymentMethodId,
    spaceId,
    period,
    usage,
    billingEmail,
    fullName,
    streetAddress
  });

  trackUserAction('checkout_subscription', {
    userId,
    spaceId,
    billingEmail,
    fullName,
    streetAddress,
    usage,
    period,
    tier: 'pro',
    result: paymentIntentStatus === 'succeeded' ? 'success' : 'failure'
  });

  res.status(200).json({
    paymentIntentStatus,
    clientSecret,
    subscriptionId
  });
}

export default withSessionRoute(handler);
