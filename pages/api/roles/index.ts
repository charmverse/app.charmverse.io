import type { Prisma, Role, SpacePermission, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import { ApiError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { requirePaidPermissionsSubscription } from 'lib/middleware/requirePaidPermissionsSubscription';
import { requireSpaceMembership } from 'lib/middleware/requireSpaceMembership';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

export type CreateRoleInput = {
  spaceId: string;
  name: string;
  userIds?: string[];
};

handler
  .get(requireKeys([{ key: 'spaceId', valueType: 'uuid' }]), listSpaceRoles)
  .use(requireUser)
  .use(
    requirePaidPermissionsSubscription({
      key: 'spaceId',
      resourceIdType: 'space',
      location: 'body'
    })
  )
  .use(requireSpaceMembership({ adminOnly: true }))
  .use(requireKeys<Role>([{ key: 'spaceId', valueType: 'uuid' }, 'name'], 'body'))
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
  const data = req.body as CreateRoleInput;

  const creationData = {
    name: data.name,
    space: {
      connect: {
        id: data.spaceId
      }
    },
    spaceRolesToRole: data.userIds
      ? {
          create: data.userIds.map((userId) => ({
            spaceRole: {
              connect: {
                spaceUser: {
                  userId,
                  spaceId: data.spaceId
                }
              }
            }
          }))
        }
      : undefined,
    createdBy: req.session.user?.id
  } as Prisma.RoleCreateInput;

  creationData.name = data.name;

  const role = await prisma.role.create({ data: creationData });
  trackUserAction('add_role', {
    userId: req.session.user.id,
    spaceId: data.spaceId,
    name: data.name
  });

  return res.status(201).json(role);
}

export default withSessionRoute(handler);
