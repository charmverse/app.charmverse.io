
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import log from 'lib/log';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { updateTrackUserProfileById } from 'lib/metrics/mixpanel/updateTrackUserProfileById';
import { logInviteAccepted } from 'lib/metrics/postToDiscord';
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
  const spaceRole = await prisma.spaceRole.findMany({
    where: {
      userId,
      spaceId: invite.spaceId
    }
  });

  // Only proceed if they are not a member of the workspace
  if (spaceRole.length === 0) {
    log.info('User joined workspace via invite', { spaceId: invite.spaceId, userId });
    const createdSpaceRole = await prisma.spaceRole.create({
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

    logInviteAccepted({ spaceId: createdSpaceRole.spaceId });

    updateTrackUserProfileById(userId);
    trackUserAction('join_a_workspace', { userId, source: 'invite_link', spaceId: invite.spaceId });

    const roleIdsToAssign: string[] = (await prisma.inviteLinkToRole.findMany({
      where: {
        inviteLinkId: invite.id
      },
      select: {
        roleId: true
      }
    })).map(({ roleId }) => roleId);

    await prisma.$transaction([
      ...roleIdsToAssign.map(roleId => prisma.spaceRoleToRole.upsert({
        where: {
          spaceRoleId_roleId: {
            spaceRoleId: createdSpaceRole.id,
            roleId
          }
        },
        create: {
          roleId,
          spaceRoleId: createdSpaceRole.id
        },
        update: {}
      })),
      prisma.inviteLink.update({
        where: { id: invite.id },
        data: {
          useCount: invite.useCount + 1
        }
      })
    ]);
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

