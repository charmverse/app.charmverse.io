
import type { InviteLink, InviteLinkToRole, Role, User } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { createInviteLink } from 'lib/invites';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

export type InviteLinkPopulated = InviteLink & { author: User, inviteLinkToRoles: (InviteLinkToRole & { role: Role })[] };

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership())
  .get(getInviteLinks)
  .use(requireSpaceMembership({ adminOnly: true }))
  .post(createInviteLinkEndpoint);

async function createInviteLinkEndpoint (req: NextApiRequest, res: NextApiResponse) {
  const userId = req.session.user.id;
  const { maxAgeMinutes, maxUses, spaceId } = req.body;

  const invite = await createInviteLink({
    createdBy: userId,
    maxAgeMinutes,
    maxUses,
    spaceId: spaceId as string
  });

  trackUserAction(
    'add_invite_link',
    {
      userId, spaceId, maxNumberOfUses: maxUses === -1 ? 'no limit' : maxUses, expires: maxAgeMinutes === -1 ? 'never' : Math.floor(maxAgeMinutes / 60)
    }
  );

  return res.status(200).json(invite);
}
async function getInviteLinks (req: NextApiRequest, res: NextApiResponse<InviteLinkPopulated[] | { error: string }>) {

  const spaceId = req.query.spaceId as string;
  if (!spaceId) {
    return res.status(400).json({ error: 'spaceId is required' });
  }

  const invites = await prisma.inviteLink.findMany({
    where: {
      spaceId
    },
    include: {
      author: true,
      inviteLinkToRoles: {
        include: {
          role: true
        }
      }
    }
  });
  return res.status(200).json(invites);
}

export default withSessionRoute(handler);
