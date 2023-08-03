import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser, requireSpaceMembership, requireKeys } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import type { CouponDetails } from 'lib/subscription/getCouponDetails';
import { validateDiscountCode } from 'lib/subscription/validateDiscountCode';

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

  const couponDetails = await validateDiscountCode({ spaceId, coupon: couponCode });

  res.status(200).json(couponDetails);
}

export default withSessionRoute(handler);
