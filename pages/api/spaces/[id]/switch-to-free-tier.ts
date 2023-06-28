import { log } from '@charmverse/core/log';
import type { Space } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { getActiveSpaceSubscription } from 'lib/subscription/getActiveSpaceSubscription';
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
  .post(switchToFreeTier);

async function switchToFreeTier(req: NextApiRequest, res: NextApiResponse<Space>) {
  const { id: spaceId } = req.query as { id: string };

  const updatedSpace = await prisma.space.update({
    where: {
      id: spaceId
    },
    data: {
      paidTier: 'free'
    }
  });

  try {
    const subscription = await getActiveSpaceSubscription({
      spaceId
    });
    if (subscription) {
      await stripeClient.subscriptions.del(subscription.subscriptionId, {
        cancellation_details: {
          comment: 'Downgraded to free plan'
        }
      });
      await prisma.stripeSubscription.update({
        where: {
          subscriptionId: subscription.subscriptionId
        },
        data: {
          deletedAt: new Date()
        }
      });
    }
  } catch (err) {
    log.error(`Error downgrading space ${spaceId} to free plan: ${err}`);
  }

  res.status(200).json(updatedSpace);
}

export default withSessionRoute(handler);
