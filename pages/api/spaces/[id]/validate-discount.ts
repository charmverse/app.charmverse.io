import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser, requireSpaceMembership, requireKeys } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { stripeClient } from 'lib/subscription/stripe';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(
    requireSpaceMembership({
      adminOnly: true,
      spaceIdKey: 'id'
    })
  )
  .use(requireKeys(['coupon'], 'body'))
  .post(validateDiscount);

async function validateDiscount(req: NextApiRequest, res: NextApiResponse<{ valid: boolean }>) {
  const coupon = req.body.coupon;

  await stripeClient.coupons.retrieve(coupon);

  res.status(200).end();
}

export default withSessionRoute(handler);
