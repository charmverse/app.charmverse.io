
import type { InviteLink, User } from '@prisma/client';
import { prisma } from 'db';
import { createInviteLink } from 'lib/invites';
import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

export type InviteLinkPopulated = InviteLink & { author: User };

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership())
  .get(getInviteLinks)
  .use(requireSpaceMembership({ adminOnly: true }))
  .post(createInviteLinkEndpoint);

async function createInviteLinkEndpoint (req: NextApiRequest, res: NextApiResponse) {

  const invite = await createInviteLink({
    createdBy: req.session.user.id,
    maxAgeMinutes: req.body.maxAgeMinutes,
    maxUses: req.body.maxUses,
    spaceId: req.body.spaceId as string
  });
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
      author: true
    }
  });
  return res.status(200).json(invites);
}

export default withSessionRoute(handler);
