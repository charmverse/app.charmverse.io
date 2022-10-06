
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import log from 'lib/log';
import { logInviteAccepted } from 'lib/log/userEvents';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { updateTrackUserProfileById } from 'lib/metrics/mixpanel/updateTrackUserProfileById';
import { hasAccessToSpace, onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .post(acceptInvite)
  .delete(deleteInvite);

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
    log.info('User joined workspace via invite', { spaceId: invite.spaceId, userId });
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

    logInviteAccepted({ spaceId: newRole.spaceId });

    updateTrackUserProfileById(userId);
    trackUserAction('join_a_workspace', { userId, source: 'invite_link', spaceId: invite.spaceId });

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

  const { id } = req.query;

  const existingInvite = await prisma.inviteLink.findUnique({
    where: {
      id: id as string
    }
  });

  if (!existingInvite) {
    throw new DataNotFoundError(`Invite with id ${id} not found`);
  }

  const { error } = await hasAccessToSpace({
    spaceId: existingInvite.spaceId,
    userId: req.session.user.id,
    adminOnly: true
  });

  if (error) {
    throw error;
  }

  await prisma.inviteLink.delete({
    where: {
      id: req.query.id as string
    }
  });
  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);

