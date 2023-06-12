import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { createProSubscription } from 'lib/subscription/createProSubscription';
import type { SpaceSubscription } from 'lib/subscription/getSpaceSubscription';
import { getSpaceSubscription } from 'lib/subscription/getSpaceSubscription';
import type { CreatePaymentSubscriptionResponse, CreateSubscriptionRequest } from 'lib/subscription/interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(
    requireSpaceMembership({
      adminOnly: false,
      spaceIdKey: 'id'
    })
  )
  .get(getSpaceSubscriptionController)
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .post(createPaymentSubscription)
  .delete(deletePaymentSubscription);

async function getSpaceSubscriptionController(req: NextApiRequest, res: NextApiResponse<SpaceSubscription | null>) {
  const { id: spaceId } = req.query as { id: string };

  const spaceSubscription = await getSpaceSubscription({
    spaceId
  });

  return res.status(200).json(spaceSubscription);
}

async function createPaymentSubscription(req: NextApiRequest, res: NextApiResponse<CreatePaymentSubscriptionResponse>) {
  const { id: spaceId } = req.query as { id: string };
  const { period, productId, billingEmail, name, address, coupon } = req.body as CreateSubscriptionRequest;

  const { clientSecret, paymentIntentStatus } = await createProSubscription({
    spaceId,
    period,
    productId,
    billingEmail,
    name,
    address,
    coupon
  });

  res.status(200).json({
    paymentIntentStatus,
    clientSecret
  });
}

async function deletePaymentSubscription(req: NextApiRequest, res: NextApiResponse<void>) {
  const { id: spaceId } = req.query as { id: string };

  const userId = req.session.user.id;

  await prisma.stripeSubscription.deleteMany({
    where: {
      spaceId
    }
  });

  await prisma.space.update({
    where: {
      id: spaceId
    },
    data: {
      updatedAt: new Date(),
      updatedBy: userId,
      paidTier: 'free'
    }
  });

  res.status(200).end();
}

export default withSessionRoute(handler);
