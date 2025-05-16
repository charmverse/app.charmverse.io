import { prisma } from '@charmverse/core/prisma-client';
import { onError, onNoMatch, requireSpaceMembership, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .post(cancelSubscriptionController);

async function cancelSubscriptionController(req: NextApiRequest, res: NextApiResponse<string>) {
  const { id: spaceId } = req.query as { id: string };
  const userId = req.session.user.id;

  await prisma.space.update({
    where: { id: spaceId },
    data: { subscriptionCancelledAt: new Date(), subscriptionCancelledBy: userId }
  });

  res.status(200).end();
}

export default withSessionRoute(handler);
