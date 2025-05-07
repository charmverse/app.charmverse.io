import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { signJwt } from '@packages/lib/webhookPublisher/authentication';
import { createSigningSecret } from '@packages/lib/webhookPublisher/subscribeToEvents';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' })).post(testSpaceWebhook);

async function testSpaceWebhook(req: NextApiRequest, res: NextApiResponse<{ status: number }>) {
  const { id: spaceId } = req.query;

  const { webhookUrl } = req.body as { webhookUrl: string };
  const space = await prisma.space.findUnique({
    where: {
      id: spaceId as string
    },
    select: {
      webhookSigningSecret: true
    }
  });
  const spaceWebhookSigningSecret = space?.webhookSigningSecret ?? createSigningSecret();
  const secret = Buffer.from(spaceWebhookSigningSecret, 'hex');
  const webhookData = {
    event: 'test',
    spaceId,
    createdAt: new Date().toISOString()
  };

  const signedJWT = await signJwt('webhook', webhookData, secret);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: JSON.stringify(webhookData),
      headers: {
        Signature: signedJWT
      }
    });

    return res.status(200).json({
      status: response.status
    });
  } catch (error) {
    return res.status(200).json({
      status: 500
    });
  }
}

export default withSessionRoute(handler);
