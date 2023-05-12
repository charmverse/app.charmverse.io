import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

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
  const { period, usage, paymentMethodId, spaceId } = req.body as CreateProSubscriptionRequest;

  const { clientSecret, paymentIntentStatus } = await createProSubscription({
    paymentMethodId,
    spaceId,
    period,
    usage
  });

  res.status(200).json({
    paymentIntentStatus,
    clientSecret
  });
}

export default withSessionRoute(handler);
