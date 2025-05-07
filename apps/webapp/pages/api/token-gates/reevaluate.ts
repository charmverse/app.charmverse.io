import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { reevaluateRoles } from '@packages/lib/tokenGates/reevaluateRoles';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(reevaluateTokenGatesHandler);

async function reevaluateTokenGatesHandler(req: NextApiRequest, res: NextApiResponse<string[]>) {
  const { user, isRemote } = req.session;

  const { spaceId } = req.body as { spaceId: string };

  const newRoles = !isRemote ? await reevaluateRoles({ userId: user.id, spaceId }) : [];

  res.status(200).send(newRoles);
}

export default withSessionRoute(handler);
