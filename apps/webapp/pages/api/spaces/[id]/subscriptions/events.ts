import { onError, onNoMatch, requireSpaceMembership, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { type SubscriptionEvent, getSubscriptionEvents } from '@packages/subscriptions/getSubscriptionEvents';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .get(getSubscriptionEventsController);

async function getSubscriptionEventsController(req: NextApiRequest, res: NextApiResponse<SubscriptionEvent[]>) {
  const { id: spaceId } = req.query as { id: string };
  const subscriptionEvents = await getSubscriptionEvents(spaceId);

  res.status(200).json(subscriptionEvents);
}

export default withSessionRoute(handler);
