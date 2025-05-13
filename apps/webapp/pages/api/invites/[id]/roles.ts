import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { InviteLinkWithRoles } from '@packages/lib/invites/getSpaceInviteLinks';
import { updateInviteLinkRoles } from '@packages/lib/invites/updateInviteLinkRoles';
import { onError, onNoMatch, requireKeys, requireUser } from '@packages/lib/middleware';
import { requirePaidPermissionsSubscription } from '@packages/lib/middleware/requirePaidPermissionsSubscription';
import { requireSpaceMembership } from '@packages/lib/middleware/requireSpaceMembership';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys(['roleIds', 'spaceId'], 'body'))
  .use(requirePaidPermissionsSubscription({ key: 'spaceId', resourceIdType: 'space', location: 'body' }))
  .use(requireSpaceMembership({ adminOnly: true }))
  .put(updateInviteLinkRolesHandler);

async function updateInviteLinkRolesHandler(req: NextApiRequest, res: NextApiResponse<InviteLinkWithRoles>) {
  const { roleIds } = req.body as { roleIds: string[] };
  const inviteLinkId = req.query.id as string;
  const updatedInvite = await updateInviteLinkRoles({ roleIds, inviteLinkId });

  return res.status(200).json(updatedInvite);
}

export default withSessionRoute(handler);
