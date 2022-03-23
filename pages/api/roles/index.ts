
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Prisma, Role, SpaceRoleToRole } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser, requireKeys } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { IEventToLog, postToDiscord } from 'lib/logs/notifyDiscord';
import { requireSpaceMembership } from 'lib/middleware/requireSpaceMembership';
import { IApiError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireSpaceMembership)
  .get(listSpaceRoles)
  .delete(deleteRole)
  .use(requireKeys<Role>(['spaceId', 'name'], 'body'))
  .post(createRole);

async function listSpaceRoles (req: NextApiRequest, res: NextApiResponse<Partial<Role> [] | IApiError>) {
  const { spaceId } = req.query;

  if (!spaceId) {
    return res.status(400).json({
      message: 'Please provide a valid space ID'
    });
  }

  const roles = await prisma.role.findMany({
    where: {
      spaceId: spaceId as string
    },
    select: {
      id: true,
      name: true,
      spaceRolesToRole: {
        select: {
          spaceRole: {
            select: {
              user: true
            }
          }
        }
      }
    }
  });

  return res.status(200).json(roles);
}

async function createRole (req: NextApiRequest, res: NextApiResponse<Role>) {
  const data = req.body as Role;

  const creationData = {
    name: data.name,
    space: {
      connect: {
        id: data.spaceId
      }
    },
    createdBy: req.session.user?.id
  } as Prisma.RoleCreateInput;

  creationData.name = data.name;

  const role = await prisma.role.create({ data: creationData });

  return res.status(200).json(role);
}

async function deleteRole (req: NextApiRequest, res: NextApiResponse) {
  const data = req.body as SpaceRoleToRole & Role;

  if (!data.roleId) {
    return res.status(400).json({ message: 'Please provide a valid role id' } as any);
  }

  // Use space ID assertion to prevent role deletion
  await prisma.role.deleteMany({
    where: {
      id: data.roleId,
      spaceId: data.spaceId
    }
  });

  return res.status(200).json({ success: true });
}

export default withSessionRoute(handler);
