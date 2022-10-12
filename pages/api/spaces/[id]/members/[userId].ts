
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { onError, onNoMatch, requireKeys, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { MinimumOneSpaceAdminRequiredError } from 'lib/spaces/errors';
import { AdministratorOnlyError, UserIsNotSpaceMemberError } from 'lib/users/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .delete(deleteMember)
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .use(requireKeys(['isAdmin'], 'body'))
  .put(updateMember);

async function updateMember (req: NextApiRequest, res: NextApiResponse) {

  const userId = req.query.userId as string;
  const spaceId = req.query.id as string;

  const newAdminStatus = req.body.isAdmin;

  // Check the space won't end up with 0 admins
  if (newAdminStatus === false) {
    const otherAdmins = await prisma.spaceRole.count({
      where: {
        isAdmin: true,
        spaceId,
        userId: {
          not: req.session.user.id
        }
      }
    });

    if (otherAdmins === 0) {
      throw new MinimumOneSpaceAdminRequiredError();
    }
  }

  await prisma.spaceRole.update({
    where: {
      spaceUser: {
        userId,
        spaceId
      }
    },
    data: {
      isAdmin: req.body.isAdmin
    }
  });
  res.status(200).json({ ok: true });
}

async function deleteMember (req: NextApiRequest, res: NextApiResponse) {

  const requestingUserId = req.session.user.id;

  const userId = req.query.userId as string;
  const spaceId = req.query.id as string;

  const requesterRole = await prisma.spaceRole.findUnique({
    where: {
      spaceUser: {
        spaceId,
        userId: requestingUserId
      }
    }
  });

  if (!requesterRole) {
    throw new UserIsNotSpaceMemberError();
  }

  // Non admin user trying to delete another user
  if (requesterRole.isAdmin !== true && userId !== requestingUserId) {
    throw new AdministratorOnlyError();
  }
  else if (requesterRole.isAdmin && userId === requestingUserId) {
    const otherAdmins = await prisma.spaceRole.count({
      where: {
        isAdmin: true,
        spaceId,
        userId: {
          not: requestingUserId
        }
      }
    });

    if (otherAdmins === 0) {
      throw new MinimumOneSpaceAdminRequiredError();
    }
  }

  await prisma.spaceRole.delete({
    where: {
      spaceUser: {
        spaceId,
        userId
      }
    }
  });
  res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
