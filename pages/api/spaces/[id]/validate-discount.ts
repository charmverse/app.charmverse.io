import { InvalidInputError } from '@charmverse/core/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser, requireSpaceMembership, requireKeys } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import type { CouponDetails } from 'lib/subscription/getCouponDetails';
import { getCouponDetails } from 'lib/subscription/getCouponDetails';

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

async function validateDiscount(req: NextApiRequest, res: NextApiResponse<CouponDetails | null>) {
  const couponCode = req.body.coupon as string;
  const spaceId = req.query.id as string;

  if (!couponCode) {
    res.status(200).json(null);
  }

  const couponDetails = await getCouponDetails(couponCode);

  if (!couponDetails) {
    throw new InvalidInputError(`Invalid promotional code ${couponCode} for space ${spaceId}`);
  }

  res.status(200).json(couponDetails);
}

export default withSessionRoute(handler);
