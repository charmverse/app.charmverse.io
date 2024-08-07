import type { InviteLink } from '@charmverse/core/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { createInviteLink } from 'lib/invites/createInviteLink';
import type { InviteLinkWithRoles } from 'lib/invites/getSpaceInviteLinks';
import { getSpaceInviteLinks } from 'lib/invites/getSpaceInviteLinks';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'spaceId' }))
  .get(getInviteLinks)
  .use(requireSpaceMembership({ adminOnly: true }))
  .post(createInviteLinkEndpoint);

async function createInviteLinkEndpoint(req: NextApiRequest, res: NextApiResponse<InviteLink>) {
  const userId = req.session.user.id;
  const { maxAgeMinutes, maxUses, spaceId, visibleOn } = req.body;

  const invite = await createInviteLink({
    createdBy: userId,
    maxAgeMinutes,
    maxUses,
    visibleOn,
    spaceId: spaceId as string
  });

  trackUserAction('add_invite_link', {
    userId,
    spaceId,
    maxNumberOfUses: maxUses === -1 ? 'no limit' : maxUses,
    expires: maxAgeMinutes === -1 ? 'never' : Math.floor(maxAgeMinutes / 60)
  });

  return res.status(201).json(invite);
}
async function getInviteLinks(req: NextApiRequest, res: NextApiResponse<InviteLinkWithRoles[]>) {
  if (req.isGuest) {
    return res.status(200).json([]);
  }

  const spaceId = req.query.spaceId as string;

  const { error } = await hasAccessToSpace({
    spaceId,
    userId: req.session.user.id,
    adminOnly: true
  });

  const invites = await getSpaceInviteLinks({
    isAdmin: !error,
    spaceId
  });

  return res.status(200).json(invites);
}

export default withSessionRoute(handler);
