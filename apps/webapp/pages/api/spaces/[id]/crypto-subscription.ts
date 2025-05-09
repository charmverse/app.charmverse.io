import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireSpaceMembership, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { createCryptoSubscription } from '@packages/lib/subscription/createCryptoSubscription';
import type {
  CreateCryptoSubscriptionRequest,
  CreateCryptoSubscriptionResponse
} from '@packages/lib/subscription/interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys(['billingEmail', 'blockQuota', 'period'], 'body'))
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .post(createCryptoSubscriptionIntent);

async function createCryptoSubscriptionIntent(
  req: NextApiRequest,
  res: NextApiResponse<CreateCryptoSubscriptionResponse>
) {
  const spaceId = req.query.id as string;
  const { billingEmail, coupon, blockQuota, period, address, name } = req.body as CreateCryptoSubscriptionRequest;

  const cryptoUrl = await createCryptoSubscription({
    billingEmail,
    blockQuota,
    period,
    address,
    name,
    coupon,
    spaceId
  });

  res.status(200).json(cryptoUrl);
}

export default withSessionRoute(handler);
