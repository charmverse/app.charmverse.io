import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { AuthSig } from 'lib/blockchain/interfaces';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { reevaluateRoles } from 'lib/tokenGates/reevaluateRoles';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(reevaluateTokenGatesHandler);

async function reevaluateTokenGatesHandler(req: NextApiRequest, res: NextApiResponse<string[]>) {
  const { user, isRemote } = req.session;

  const { spaceId, authSig } = req.body as { spaceId: string; authSig: AuthSig };

  const newRoles = !isRemote ? await reevaluateRoles({ authSig, userId: user.id, spaceId }) : [];

  res.status(200).send(newRoles);
}

export default withSessionRoute(handler);
