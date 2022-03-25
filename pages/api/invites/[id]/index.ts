
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { prisma } from 'db';
import { SpaceRole } from '@prisma/client';
import { IEventToLog, postToDiscord } from 'lib/log/userEvents';

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

  const userHasRoleInSpace = roles.some(role => role.spaceId === invite.spaceId);

  if (userHasRoleInSpace === false) {
    console.log('User joined workspace via invite', { spaceId: invite.spaceId, userId });
    const newRole = await prisma.spaceRole.create({
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

    logInviteAccepted(newRole);

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

/**
 * Assumes that a first page will be created by the system
 * Should be called after a page is created
 * @param page
 */
async function logInviteAccepted (role: SpaceRole) {

  const space = await prisma.space.findUnique({
    where: {
      id: role.spaceId
    }
  });

  const eventLog: IEventToLog = {
    eventType: 'join_workspace_from_link',
    funnelStage: 'acquisition',
    message: `Someone joined ${space!.domain} workspace via an invite link`
  };

  postToDiscord(eventLog);
}
