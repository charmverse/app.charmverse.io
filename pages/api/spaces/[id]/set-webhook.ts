import crypto from 'node:crypto';

import type { Space, WebhookSubscription } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { ApiError, onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
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
  .put(setSpaceWebhook);

export type SetSpaceWebhookBody = {
  webhookUrl: string;
  events: { [key: string]: boolean };
};

export type SetSpaceWebhookResponse = {
  webhookSubscriptionUrl: string | null;
  webhookSubscriptions: WebhookSubscription[];
  webhookSigningSecret: string | null;
};

async function setSpaceWebhook(req: NextApiRequest, res: NextApiResponse<SetSpaceWebhookResponse>) {
  const { id: spaceId } = req.query;
  const { webhookUrl, events } = req.body as SetSpaceWebhookBody;
  const userId = req.session.user.id;

  const operationArray = [];

  const space = await prisma.space.findFirst({
    where: {
      id: spaceId as string
    }
  });

  if (!space) {
    throw new ApiError({
      message: 'Space not found',
      errorType: 'Data not found'
    });
  }

  // Check if space already has webhook signing secret generated if not, create one
  const spaceWebhookSigningSecret = space.webhookSigningSecret ?? crypto.randomBytes(160 / 8).toString('hex');

  // Generate prisma operations
  for (const [scope, subscribed] of Object.entries(events)) {
    // The deletedAt is the key factor determining the subscription here
    // If not present, the space will be subscribed to that event
    const deletedAt = subscribed ? null : new Date();

    // Push the operation in the array
    operationArray.push(
      prisma.webhookSubscription.upsert({
        where: {
          scope_spaceId: {
            scope,
            spaceId: spaceId as string
          }
        },
        update: {
          deletedAt,
          createdBy: userId
        },
        create: {
          scope,
          spaceId: spaceId as string,
          deletedAt,
          createdBy: userId
        }
      })
    );
  }

  // Update the subscriptions
  await prisma.$transaction([...operationArray]);

  // Update the space URL and get the subscriptions back
  const updatedSpace = await prisma.space.update({
    where: {
      id: spaceId as string
    },
    data: {
      webhookSubscriptionUrl: webhookUrl,
      webhookSigningSecret: spaceWebhookSigningSecret
    },
    select: {
      webhookSubscriptionUrl: true,
      webhookSigningSecret: true,
      webhookSubscriptions: true
    }
  });

  return res.status(200).json(updatedSpace);
}

export default withSessionRoute(handler);
