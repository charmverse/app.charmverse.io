
import type { TokenGateToRole } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { requireSpaceMembership } from 'lib/middleware/requireSpaceMembership';
import { withSessionRoute } from 'lib/session/withSession';
import { updateTokenGateRoles } from 'lib/token-gates/updateTokenGateRoles';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireKeys(['roleIds', 'spaceId'], 'body'))
  .use(requireSpaceMembership({ adminOnly: true }))
  .post(updateTokenGateRolesHandler);

async function updateTokenGateRolesHandler (req: NextApiRequest, res: NextApiResponse<TokenGateToRole[]>) {
  const { roleIds } = req.body as { roleIds: string[] };
  const tokenGateId = req.query.id as string;
  const tokenGateToRoles = await updateTokenGateRoles(roleIds, tokenGateId);

  return res.status(200).json(tokenGateToRoles);
}

export default withSessionRoute(handler);
