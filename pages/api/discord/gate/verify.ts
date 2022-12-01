import type { Space } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { applyDiscordGate } from 'lib/discord/applyDiscordGate';
import { onError, onNoMatch } from 'lib/middleware';
import { requireKeys } from 'lib/middleware/requireKeys';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireKeys([{ key: 'spaceId', truthy: true }], 'body')).post(verifyDiscordGateEndpoint);

async function verifyDiscordGateEndpoint(req: NextApiRequest, res: NextApiResponse<Space>) {
  const { spaceId } = req.body as { spaceId: string };
  const userId = req.session.user.id;

  const space = await applyDiscordGate({ spaceId, userId });

  if (!space) {
    throw new UnauthorisedActionError('You do not have access to this space');
  }

  return res.status(201).json(space);
}

export default withSessionRoute(handler);
