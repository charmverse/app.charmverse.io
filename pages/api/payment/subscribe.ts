import { UnauthorisedActionError, hasAccessToSpace } from '@charmverse/core';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { NotFoundError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { createSubscription } from 'lib/payment/createSubscription';
import type { SubscriptionPeriod, SubscriptionUsage } from 'lib/payment/utils';
import { withSessionRoute } from 'lib/session/withSession';

export type CreatePaymentSubscriptionRequest = {
  spaceId: string;
  paymentMethodId: string;
  usage: SubscriptionUsage;
  period: SubscriptionPeriod;
};

export type CreatePaymentSubscriptionResponse = {
  clientSecret: string | null;
};

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(createPaymentSubscription);

async function createPaymentSubscription(req: NextApiRequest, res: NextApiResponse<CreatePaymentSubscriptionResponse>) {
  const { period, usage, paymentMethodId, spaceId } = req.body as CreatePaymentSubscriptionRequest;
  const userId = req.session.user.id;
  const spaceAccess = await hasAccessToSpace({ spaceId, userId, disallowGuest: true, adminOnly: true });
  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    select: {
      domain: true
    }
  });

  if (spaceAccess.error) {
    throw new UnauthorisedActionError();
  }

  if (!space) {
    throw new NotFoundError('Space not found');
  }

  const { clientSecret } = await createSubscription({
    paymentMethodId,
    spaceId,
    spaceDomain: space.domain,
    period,
    usage
  });

  res.status(200).json({
    clientSecret
  });
}

export default withSessionRoute(handler);
