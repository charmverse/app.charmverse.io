import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireSpaceMembership, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { createCryptoSubscription } from 'lib/subscription/createCryptoSubscription';
import type { CreateCryptoSubscriptionRequest, CreateCryptoSubscriptionResponse } from 'lib/subscription/interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys(['subscriptionId', 'email'], 'body'))
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .post(createCryptoSubscriptionIntent);

async function createCryptoSubscriptionIntent(
  req: NextApiRequest,
  res: NextApiResponse<CreateCryptoSubscriptionResponse>
) {
  const spaceId = req.query.id as string;
  const { email, subscriptionId, coupon } = req.body as CreateCryptoSubscriptionRequest;

  const cryptoUrl = await createCryptoSubscription({
    subscriptionId,
    email,
    coupon,
    spaceId
  });

  res.status(200).json(cryptoUrl);
}

export default withSessionRoute(handler);
