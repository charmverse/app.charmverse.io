import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { checkDiscordGate } from '@packages/lib/discord/collabland/checkDiscordGate';
import type { CheckDiscordGateResult } from '@packages/lib/discord/interface';
import { onError, onNoMatch } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(checkDiscordGateEndpoint);

async function checkDiscordGateEndpoint(req: NextApiRequest, res: NextApiResponse<CheckDiscordGateResult>) {
  const spaceDomain = req.query.spaceDomain as string;
  const userId = req.session?.user?.id;

  const result = await checkDiscordGate({ spaceDomain, userId });

  return res.status(201).json(result);
}

export default withSessionRoute(handler);
