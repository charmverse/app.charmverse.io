import type { AuthSig } from 'lit-js-sdk';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { reevaluateRoles } from 'lib/token-gates/reevaluateRoles';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(reevaluateTokenGatesHandler);

async function reevaluateTokenGatesHandler(req: NextApiRequest, res: NextApiResponse<string[]>) {
  const user = req.session.user;
  const { spaceId, authSig } = req.body as { spaceId: string; authSig: AuthSig };

  const newRoles = await reevaluateRoles({ authSig, userId: user.id, spaceId });
  res.status(200).send(newRoles);
}

export default withSessionRoute(handler);
