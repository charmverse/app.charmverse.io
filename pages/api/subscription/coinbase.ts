import type { resources } from 'coinbase-commerce-node';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { createCoinbasePayment } from 'lib/subscription/createCoinbasePayment';
import type { CreateCoinbasePaymentRequest } from 'lib/subscription/createCoinbasePayment';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'spaceId' }))
  .post(createCoinbasePaymentSubscription);

async function createCoinbasePaymentSubscription(req: NextApiRequest, res: NextApiResponse<resources.Charge>) {
  const { period, usage, spaceId, billingEmail, fullName, streetAddress } = req.body as CreateCoinbasePaymentRequest;
  const userId = req.session.user.id as string;

  const coinbaseData = await createCoinbasePayment({
    spaceId,
    period,
    usage,
    userId,
    billingEmail,
    fullName,
    streetAddress
  });

  res.status(200).json(coinbaseData);
}

export default withSessionRoute(handler);
