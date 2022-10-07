
import type { InviteLinkToRole } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { updateInviteLinkRoles } from 'lib/invites/updateTokenGateRoles';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { requireSpaceMembership } from 'lib/middleware/requireSpaceMembership';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireKeys(['roleIds', 'spaceId'], 'body'))
  .use(requireSpaceMembership({ adminOnly: true }))
  .post(updateInviteLinkRolesHandler);

async function updateInviteLinkRolesHandler (req: NextApiRequest, res: NextApiResponse<InviteLinkToRole[]>) {
  const { roleIds } = req.body as { roleIds: string[] };
  const inviteLinkId = req.query.id as string;
  const inviteLinkToRoles = await updateInviteLinkRoles(roleIds, inviteLinkId);

  return res.status(200).json(inviteLinkToRoles);
}

export default withSessionRoute(handler);
