
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { prisma } from 'db';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(acceptInvite).delete(deleteInvite);

async function acceptInvite (req: NextApiRequest, res: NextApiResponse) {

  const invite = await prisma.inviteLink.findUnique({
    where: {
      id: req.query.id as string
    }
  });
  if (!invite) {
    return res.status(421).send({ message: 'Invite not found' });
  }
  const userId = req.session.user.id;
  const roles = await prisma.spaceRole.findMany({
    where: {
      userId
    }
  });
  if (!roles.some(role => role.spaceId === invite.spaceId)) {
    console.log('User joined workspace via invite', { spaceId: invite.spaceId, userId });
    await prisma.spaceRole.create({
      data: {
        space: {
          connect: {
            id: invite.spaceId
          }
        },
        user: {
          connect: {
            id: userId
          }
        }
      }
    });
    await prisma.inviteLink.update({
      where: { id: invite.id },
      data: {
        useCount: invite.useCount + 1
      }
    });
  }

  return res.status(200).json({ ok: true });
}

async function deleteInvite (req: NextApiRequest, res: NextApiResponse) {

  await prisma.inviteLink.delete({
    where: {
      id: req.query.id as string
    }
  });
  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
