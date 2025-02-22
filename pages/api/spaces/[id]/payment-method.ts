import { log } from '@charmverse/core/log';
import { NotFoundError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireSpaceMembership, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import type { CreatePaymentMethodRequest, CreatePaymentMethodResponse } from 'lib/subscription/createPaymentMethod';
import { createPaymentMethod } from 'lib/subscription/createPaymentMethod';
import { getActiveSpaceSubscription } from 'lib/subscription/getActiveSpaceSubscription';
import type { UpdatePaymentMethodRequest } from 'lib/subscription/updatePaymentMethod';
import { updatePaymentMethod } from 'lib/subscription/updatePaymentMethod';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .post(requireKeys(['paymentMethodId'], 'body'), createPaymentMethodController)
  .put(requireKeys(['paymentMethodId'], 'body'), updatePaymentMethodController);

async function createPaymentMethodController(req: NextApiRequest, res: NextApiResponse<CreatePaymentMethodResponse>) {
  const { id: spaceId } = req.query as { id: string };
  const userId = req.session.user.id;
  const { paymentMethodId } = req.body as CreatePaymentMethodRequest;

  const subscriptionData = await getActiveSpaceSubscription({ spaceId });

  if (!subscriptionData) {
    throw new NotFoundError(`Subscription not found for space ${spaceId}`);
  }

  const result = await createPaymentMethod({
    customerId: subscriptionData.customerId,
    paymentMethodId
  });

  log.info(`Create payment method has been initialised for space ${spaceId} by the user ${userId}`);

  res.status(200).json(result);
}

async function updatePaymentMethodController(req: NextApiRequest, res: NextApiResponse<void>) {
  const { id: spaceId } = req.query as { id: string };
  const userId = req.session.user.id;
  const { paymentMethodId } = req.body as UpdatePaymentMethodRequest;

  const subscriptionData = await getActiveSpaceSubscription({ spaceId });

  if (!subscriptionData) {
    throw new NotFoundError(`Subscription not found for space ${spaceId}`);
  }

  await updatePaymentMethod({
    customerId: subscriptionData.customerId,
    subscriptionId: subscriptionData.subscriptionId,
    paymentMethodId
  });

  log.info(`Payment method has been updated`, { spaceId, userId });

  res.status(200).end();
}

export default withSessionRoute(handler);
