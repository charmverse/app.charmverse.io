import { log } from '@charmverse/core/log';
import { onError, onNoMatch, requireKeys, requireSpaceMembership, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { createProSubscription } from '@packages/lib/subscription/createProSubscription';
import { deleteProSubscription } from '@packages/lib/subscription/deleteProSubscription';
import type { SpaceSubscriptionWithStripeData } from '@packages/lib/subscription/getActiveSpaceSubscription';
import { getActiveSpaceSubscription } from '@packages/lib/subscription/getActiveSpaceSubscription';
import type { CreateProSubscriptionRequest, SubscriptionPaymentIntent } from '@packages/lib/subscription/interfaces';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }), getSpaceSubscriptionController)
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }));

async function getSpaceSubscriptionController(
  req: NextApiRequest,
  res: NextApiResponse<SpaceSubscriptionWithStripeData | null>
) {
  const { id: spaceId } = req.query as { id: string };

  const spaceSubscription = await getActiveSpaceSubscription({ spaceId });

  return res.status(200).json(spaceSubscription);
}

export default withSessionRoute(handler);
