import { InvalidInputError } from '@charmverse/core/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser, requireSpaceMembership, requireKeys } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { getCouponId } from 'lib/subscription/getCouponId';

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

export type ValidatedCoupon = {
  valid: boolean;
  couponId: string;
};

async function validateDiscount(req: NextApiRequest, res: NextApiResponse<ValidatedCoupon>) {
  const couponCode = req.body.coupon;
  const spaceId = req.query.id as string;

  const coupon = await getCouponId(couponCode);

  if (!coupon) {
    throw new InvalidInputError(`Invalid promotional code ${couponCode} for space ${spaceId}`);
  }

  res.status(200).end();
}

export default withSessionRoute(handler);
