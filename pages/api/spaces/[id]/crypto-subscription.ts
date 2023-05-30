import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireSpaceMembership, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import type {
  CreateCryptoSubscriptionRequest,
  CreateCryptoSubscriptionResponse
} from 'lib/subscription/createCryptoSubscription';
import { createCryptoSubscription } from 'lib/subscription/createCryptoSubscription';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys(['period', 'productId', 'billingEmail'], 'body'))
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .post(createCryptoSubscriptionIntent);

async function createCryptoSubscriptionIntent(
  req: NextApiRequest,
  res: NextApiResponse<CreateCryptoSubscriptionResponse>
) {
  const { id: spaceId } = req.query as { id: string };
  const { period, productId, paymentMethodId, billingEmail, name, address } =
    req.body as CreateCryptoSubscriptionRequest;

  const subscriptionData = await createCryptoSubscription({
    paymentMethodId,
    spaceId,
    period,
    productId,
    billingEmail,
    name,
    address
  });

  res.status(200).json(subscriptionData);
}

export default withSessionRoute(handler);
