
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { InviteLink, User } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

export type InviteLinkPopulated = InviteLink & { author: User };

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(getInviteLinks);

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
