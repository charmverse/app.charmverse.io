
import { prisma } from 'db';
import { onError, onNoMatch, requireKeys, requireSpaceMembership, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { AdministratorOnlyError, UserIsNotSpaceMemberError } from 'lib/users/errors';
import { MinimumOneSpaceAdminRequiredError } from 'lib/spaces/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .delete(deleteContributor)
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .use(requireKeys(['isAdmin'], 'body'))
  .put(updateContributor);

async function updateContributor (req: NextApiRequest, res: NextApiResponse) {

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

async function deleteContributor (req: NextApiRequest, res: NextApiResponse) {

  const userId = req.query.userId as string;
  const spaceId = req.query.id as string;

  const existingRole = await prisma.spaceRole.findUnique({
    where: {
      spaceUser: {
        spaceId,
        userId
      }
    }
  });

  if (!existingRole) {
    throw new UserIsNotSpaceMemberError();
  }

  // Non admin user trying to delete another user
  if (existingRole.isAdmin !== true && userId !== req.session.user.id) {
    throw new AdministratorOnlyError();
  }
  else if (existingRole.isAdmin) {
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

  await prisma.spaceRole.delete({
    where: {
      spaceUser: {
        userId,
        spaceId
      }
    }
  });
  res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
