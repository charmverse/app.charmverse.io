
import type { Prisma, Role, SpacePermission, User } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { ApiError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { requireSpaceMembership } from 'lib/middleware/requireSpaceMembership';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireSpaceMembership({ adminOnly: false }))
  .get(listSpaceRoles)
  .use(requireSpaceMembership({ adminOnly: true }))
  .use(requireKeys<Role>(['spaceId', 'name'], 'body'))
  .post(createRole);

export type ListSpaceRolesResponse = (Pick<Role, 'id' | 'name' | 'source'> & {
  spaceRolesToRole: {
      spaceRole: {
          user: User;
      };
  }[];
  spacePermissions: SpacePermission[];
})

async function listSpaceRoles (req: NextApiRequest, res: NextApiResponse<ListSpaceRolesResponse[]>) {
  const { spaceId } = req.query;

  if (!spaceId) {
    throw new ApiError({
      message: 'Please provide a valid space ID',
      errorType: 'Invalid input'
    });
  }

  const roles = await prisma.role.findMany({
    orderBy: { createdAt: 'asc' },
    where: {
      spaceId: spaceId as string
    },
    select: {
      id: true,
      name: true,
      source: true,
      spaceRolesToRole: {
        select: {
          spaceRole: {
            select: {
              user: true
            }
          }
        }
      },
      spacePermissions: {
        where: {
          forSpaceId: spaceId as string
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

export default withSessionRoute(handler);
