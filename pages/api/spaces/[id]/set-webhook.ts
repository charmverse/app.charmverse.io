import type { WebhookSubscription } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { ApiError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { subscribeToEvents, createSigningSecret } from 'lib/webhookPublisher/subscribeToEvents';

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
  const spaceWebhookSigningSecret = space.webhookSigningSecret ?? createSigningSecret();

  await subscribeToEvents(events, spaceId as string, userId);

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
