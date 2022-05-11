
import { Prisma, SpaceRole, SpaceRoleToRole } from '@prisma/client';
import { prisma } from 'db';
import { ApiError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { requireSpaceMembership } from 'lib/middleware/requireSpaceMembership';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireSpaceMembership({ adminOnly: true }))
  .use(requireKeys<SpaceRoleToRole & SpaceRole>(['spaceId', 'roleId', 'userId'], 'body'))
  .post(assignRole)
  .delete(removeRole);

async function removeRole (req: NextApiRequest, res: NextApiResponse) {
  const data = req.body as SpaceRole & SpaceRoleToRole;

  const spaceRole = await prisma.spaceRole.findUnique({
    where: {
      spaceUser: {
        spaceId: data.spaceId,
        userId: data.userId
      }
    }
  });

  const role = await prisma.role.findFirst({
    where: {
      id: data.roleId,
      // We add the spaceId again to prevent an attempt at assigning a role from a different space
      spaceId: data.spaceId
    }
  });

  if (!role || !spaceRole || role.source === 'guild.xyz') {
    throw new ApiError({
      message: 'Cannot remove role',
      errorType: 'Invalid input'
    });
  }

  const deleteResult = await prisma.spaceRoleToRole.delete({
    where: {
      spaceRoleId_roleId: {
        roleId: role.id,
        spaceRoleId: spaceRole.id as string
      }
    }
  });

  return res.status(200).json({ success: true, deleteResult });
}

async function assignRole (req: NextApiRequest, res: NextApiResponse<{success: boolean}>) {
  const data = req.body as SpaceRole & SpaceRoleToRole;

  const spaceRole = await prisma.spaceRole.findUnique({
    where: {
      spaceUser: {
        spaceId: data.spaceId,
        userId: data.userId
      }
    }
  });

  const role = await prisma.role.findFirst({
    where: {
      id: data.roleId,
      // We add the spaceId again to prevent an attempt at assigning a role from a different space
      spaceId: data.spaceId
    }
  });

  if (!role || !spaceRole || role.source === 'guild.xyz') {
    throw new ApiError({
      message: 'Cannot assign role',
      errorType: 'Invalid input'
    });
  }

  const creationData = {
    role: {
      connect: {
        id: role.id
      }
    },
    spaceRole: {
      connect: {
        id: spaceRole?.id
      }
    }

  } as Prisma.SpaceRoleToRoleCreateInput;

  await prisma.spaceRoleToRole.create({ data: creationData });

  return res.status(200).json({ success: true });
}

export default withSessionRoute(handler);
