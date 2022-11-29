import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { checkDiscordGate } from 'lib/discord/checkDiscordGate';
import type { CheckDiscordGateResult } from 'lib/discord/interface';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(checkDiscordGateForSpace);

async function checkDiscordGateForSpace(req: NextApiRequest, res: NextApiResponse<CheckDiscordGateResult>) {
  const spaceDomain = req.query.spaceDomain as string;
  const userId = req.session.user.id;

  const result = await checkDiscordGate({ spaceDomain, userId });

  return res.status(201).json(result);
}

export default withSessionRoute(handler);
