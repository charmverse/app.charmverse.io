import type { InviteLinkToRole } from '@charmverse/core/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { InviteLinkWithRoles } from 'lib/invites/getSpaceInviteLinks';
import { updateInviteLinkRoles } from 'lib/invites/updateInviteLinkRoles';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { requireSpaceMembership } from 'lib/middleware/requireSpaceMembership';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys(['roleIds', 'spaceId'], 'body'))
  .use(requireSpaceMembership({ adminOnly: true }))
  .post(updateInviteLinkRolesHandler);

async function updateInviteLinkRolesHandler(req: NextApiRequest, res: NextApiResponse<InviteLinkWithRoles>) {
  const { roleIds } = req.body as { roleIds: string[] };
  const inviteLinkId = req.query.id as string;
  const updatedInvite = await updateInviteLinkRoles({ roleIds, inviteLinkId });

  return res.status(200).json(updatedInvite);
}

export default withSessionRoute(handler);
