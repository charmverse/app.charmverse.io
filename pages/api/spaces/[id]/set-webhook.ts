import type { Space } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(
    requireSpaceMembership({
      adminOnly: true,
      spaceIdKey: 'id'
    })
  )
  .post(setSpaceWebhook);

type SetSpaceWebhookBody = {
  webhookUrl: string;
  events: { [key: string]: boolean };
};

async function setSpaceWebhook(req: NextApiRequest, res: NextApiResponse<Space>) {
  const { id: spaceId } = req.query;
  const { webhookUrl, events } = req.body as SetSpaceWebhookBody;

  const operationArray = [];

  // Generate prisma operations
  for (const [scope, subscribed] of Object.entries(events)) {
    operationArray.push(
      prisma.webhookSubscription.upsert({
        where: {
          scope_spaceId: {
            scope,
            spaceId: spaceId as string
          }
        },
        update: {
          deletedAt: subscribed ? undefined : new Date()
        },
        create: {
          scope,
          spaceId: spaceId as string,
          deletedAt: subscribed ? undefined : new Date()
        }
      })
    );
  }

  // Update the subscriptions
  await prisma.$transaction([...operationArray]);

  // Update the space URL and get the subscriptions back
  const space = await prisma.space.update({
    where: {
      id: spaceId as string
    },
    data: {
      webhookSubscriptionUrl: webhookUrl
    },
    include: {
      webhookSubscriptions: true
    }
  });

  return res.status(200).json(space);
}

export default withSessionRoute(handler);
