import { onError, onNoMatch, requireSpaceMembership, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { DowngradeSubscriptionRequest } from '@packages/subscriptions/downgradeSubscription';
import { downgradeSubscription } from '@packages/subscriptions/downgradeSubscription';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .post(downgradeSubscriptionController);

async function downgradeSubscriptionController(req: NextApiRequest, res: NextApiResponse<string>) {
  const { id: spaceId } = req.query as { id: string };
  const userId = req.session.user.id;

  await downgradeSubscription({
    ...(req.body as DowngradeSubscriptionRequest),
    spaceId,
    userId
  });

  res.status(200).end();
}

export default withSessionRoute(handler);
