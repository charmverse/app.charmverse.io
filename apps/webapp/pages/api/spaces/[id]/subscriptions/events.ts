import type { SpaceSubscriptionTierChangeEvent } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { onError, onNoMatch, requireSpaceMembership, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .get(getSubscriptionEventsController);

async function getSubscriptionEventsController(
  req: NextApiRequest,
  res: NextApiResponse<SpaceSubscriptionTierChangeEvent[]>
) {
  const { id: spaceId } = req.query as { id: string };

  const subscriptionEvents = await prisma.spaceSubscriptionTierChangeEvent.findMany({
    where: {
      spaceId
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  res.status(200).json(subscriptionEvents);
}

export default withSessionRoute(handler);
