import { onError, onNoMatch, requireSpaceMembership, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { type SubscriptionReceipt, getSubscriptionReceipts } from '@packages/subscriptions/getSubscriptionReceipts';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .get(getSubscriptionReceiptsController);

async function getSubscriptionReceiptsController(req: NextApiRequest, res: NextApiResponse<SubscriptionReceipt[]>) {
  const { id: spaceId } = req.query as { id: string };
  const subscriptionReceipts = await getSubscriptionReceipts(spaceId);

  res.status(200).json(subscriptionReceipts);
}

export default withSessionRoute(handler);
