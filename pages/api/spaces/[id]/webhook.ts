import { prisma } from '@charmverse/core/prisma-client';
import { ApiError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

import type { SetSpaceWebhookResponse } from './set-webhook';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getSpaceWebhook);

async function getSpaceWebhook(req: NextApiRequest, res: NextApiResponse<SetSpaceWebhookResponse>) {
  const { id: spaceId } = req.query;

  const space = await prisma.space.findFirst({
    where: {
      id: spaceId as string
    },
    select: {
      webhookSubscriptionUrl: true,
      webhookSigningSecret: true,
      webhookSubscriptions: true
    }
  });

  if (!space) {
    throw new ApiError({
      message: 'Space not found',
      errorType: 'Data not found'
    });
  }

  return res.status(200).json(space);
}

export default withSessionRoute(handler);
