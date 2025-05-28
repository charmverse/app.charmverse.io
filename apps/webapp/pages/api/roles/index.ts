import type { Prisma, Role, SpacePermission } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { onError, onNoMatch, requireKeys, requireUser } from '@packages/lib/middleware';
import { requirePaidPermissionsSubscription } from '@packages/lib/middleware/requirePaidPermissionsSubscription';
import { requireSpaceMembership } from '@packages/lib/middleware/requireSpaceMembership';
import { getMaxRolesCount } from '@packages/lib/roles/getMaxRolesCount';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import { ApiError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

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

export type ListSpaceRolesResponse = Pick<Role, 'id' | 'name' | 'source' | 'archived'> & {
  spacePermissions: SpacePermission[];
  isMemberLevel?: boolean;
};

async function listSpaceRoles(req: NextApiRequest, res: NextApiResponse<ListSpaceRolesResponse[]>) {
  const { spaceId, includeArchived = false } = req.query;

  if (!spaceId || typeof spaceId !== 'string') {
    throw new ApiError({
      message: 'Please provide a valid space ID',
      errorType: 'Invalid input'
    });
  }

  const roles = await prisma.role.findMany({
    orderBy: { createdAt: 'asc' },
    where: {
      spaceId,
      archived: includeArchived ? undefined : false
    },
    select: {
      id: true,
      name: true,
      source: true,
      archived: true,
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

  // Get space and check role limits
  const space = await prisma.space.findUniqueOrThrow({
    where: { id: data.spaceId },
    select: { subscriptionTier: true }
  });

  const maxRoles = getMaxRolesCount(space.subscriptionTier);

  if (maxRoles === 0) {
    throw new ApiError({
      message: 'Custom roles are not available in the public tier',
      errorType: 'Subscription required'
    });
  }

  // Count existing roles
  const existingRolesCount = await prisma.role.count({
    where: { spaceId: data.spaceId, archived: false }
  });

  if (existingRolesCount >= maxRoles) {
    throw new ApiError({
      message: `You have reached the maximum number of custom roles (${existingRolesCount}/${maxRoles}) for your subscription tier`,
      errorType: 'Subscription required'
    });
  }

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
