import type { InviteLink } from '@charmverse/core/prisma';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { createInviteLink } from '@packages/lib/invites/createInviteLink';
import type { InviteLinkWithRoles } from '@packages/lib/invites/getSpaceInviteLinks';
import { getSpaceInviteLinks } from '@packages/lib/invites/getSpaceInviteLinks';
import { onError, onNoMatch, requireSpaceMembership } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

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
  const spaceId = req.query.spaceId as string;

  const invites = await getSpaceInviteLinks({
    userId: req.session.user?.id,
    spaceId
  });

  return res.status(200).json(invites);
}

export default withSessionRoute(handler);
