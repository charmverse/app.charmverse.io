import { DataNotFoundError, InvalidInputError } from '@charmverse/core/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import {
  onError,
  onNoMatch,
  requireUser,
  requireSpaceMembership,
  requireKeys,
  InvalidStateError
} from 'lib/middleware';
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

export type ValidatedCoupon = {
  valid: boolean;
  couponId: string;
};

async function validateDiscount(req: NextApiRequest, res: NextApiResponse<ValidatedCoupon>) {
  const couponCode = req.body.coupon;

  if (!couponCode) {
    throw new InvalidInputError(`Please enter a coupon`);
  }

  const matchedCoupon = await stripeClient.promotionCodes
    .list()
    .then((data) => data.data.find((coupon) => coupon.id === couponCode || coupon.code === couponCode));

  if (!matchedCoupon) {
    throw new DataNotFoundError(`Coupon not found ${matchedCoupon}`);
  } else if (!matchedCoupon.coupon.valid) {
    throw new InvalidStateError(`This coupon is not valid`);
  }

  res.status(200).send({
    couponId: matchedCoupon.coupon.id,
    valid: true
  });
}

export default withSessionRoute(handler);
