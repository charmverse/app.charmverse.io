import type { Prisma, Role, SpacePermission, User } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { ApiError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { requireSpaceMembership } from 'lib/middleware/requireSpaceMembership';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(listSpaceRoles)
  .use(requireUser)
  .use(requireSpaceMembership({ adminOnly: true }))
  .use(requireKeys<Role>(['spaceId', 'name'], 'body'))
  .post(createRole);

export type ListSpaceRolesResponse = Pick<Role, 'id' | 'name' | 'source'> & {
  spacePermissions: SpacePermission[];
  isMemberLevel?: boolean;
};

async function listSpaceRoles(req: NextApiRequest, res: NextApiResponse<ListSpaceRolesResponse[]>) {
  const { spaceId } = req.query;

  if (!spaceId || typeof spaceId !== 'string') {
    throw new ApiError({
      message: 'Please provide a valid space ID',
      errorType: 'Invalid input'
    });
  }

  const roles = await prisma.role.findMany({
    orderBy: { createdAt: 'asc' },
    where: {
      spaceId
    },
    select: {
      id: true,
      name: true,
      source: true,
      spacePermissions: {
        where: {
          forSpaceId: spaceId
        }
      }
    }
  });

  return res.status(200).json(roles);
}

async function createRole(req: NextApiRequest, res: NextApiResponse<Role>) {
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
  trackUserAction('add_role', {
    userId: req.session.user.id,
    spaceId: data.spaceId,
    name: data.name
  });

  return res.status(200).json(role);
}

export default withSessionRoute(handler);
