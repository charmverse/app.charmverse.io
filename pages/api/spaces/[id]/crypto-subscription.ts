import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireSpaceMembership, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { createCryptoSubscription } from 'lib/subscription/createCryptoSubscription';
import type { CreateCryptoSubscriptionResponse, CreateSubscriptionRequest } from 'lib/subscription/interfaces';

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
  const { period, productId, billingEmail, name, address, coupon } = req.body as CreateSubscriptionRequest;
  const userId = req.session.user.id;

  const cryptoUrl = await createCryptoSubscription({
    userId,
    spaceId,
    period,
    productId,
    billingEmail,
    name,
    address,
    coupon
  });

  res.status(200).json(cryptoUrl);
}

export default withSessionRoute(handler);
