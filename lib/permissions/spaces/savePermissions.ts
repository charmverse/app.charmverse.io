import type { SpaceOperation } from '@prisma/client';

import { prisma } from 'db';
import { InvalidInputError, MissingDataError } from 'lib/utilities/errors';

import type { SpacePermissions } from './listPermissions';

export async function savePermissions(spaceId: string, permissions: SpacePermissions) {
  const memberPermissions = permissions.space.filter((p) => p.assignee.group === 'space');

  // make sure we always define member/default permissions
  if (memberPermissions.length > 1) {
    throw new InvalidInputError('Only one member level space permission can be set');
  } else if (memberPermissions.length === 0) {
    throw new MissingDataError('Member level space permission is required');
  }

  // clear out existing permissions related to members and role, excluding user and public groups
  const deleteOps = getDeleteOpsForRoles(spaceId);

  const createOps = [
    ...permissions.space.map((permission) => {
      const operations = Object.entries(permission.operations)
        .filter(([, value]) => value)
        .map(([key]) => key) as SpaceOperation[];
      return prisma.spacePermission.create({
        data: {
          forSpaceId: spaceId,
          operations,
          roleId: permission.assignee.group === 'role' ? permission.assignee.id : undefined,
          spaceId: permission.assignee.group === 'space' ? permission.assignee.id : undefined
        },
        include: {
          role: true,
          space: true,
          user: true
        }
      });
    }),
    ...permissions.proposalCategories.map((permission) =>
      prisma.proposalCategoryPermission.create({
        data: {
          id: permission.id,
          proposalCategoryId: permission.proposalCategoryId,
          permissionLevel: permission.permissionLevel,
          roleId: permission.assignee.group === 'role' ? permission.assignee.id : undefined,
          spaceId: permission.assignee.group === 'space' ? permission.assignee.id : undefined
        }
      })
    ),
    ...permissions.forumCategories.map((permission) =>
      prisma.postCategoryPermission.create({
        data: {
          id: permission.id,
          postCategoryId: permission.postCategoryId,
          permissionLevel: permission.permissionLevel,
          roleId: permission.assignee.group === 'role' ? permission.assignee.id : undefined,
          spaceId: permission.assignee.group === 'space' ? permission.assignee.id : undefined
        }
      })
    )
  ];

  return prisma.$transaction([...deleteOps, ...createOps]);
}

function getDeleteOpsForRoles(spaceId: string) {
  return [
    prisma.proposalCategoryPermission.deleteMany({
      where: {
        OR: [
          {
            roleId: { not: null }
          },
          {
            spaceId: { not: null }
          }
        ],
        proposalCategory: {
          spaceId
        }
      }
    }),
    prisma.postCategoryPermission.deleteMany({
      where: {
        OR: [
          {
            roleId: { not: null }
          },
          {
            spaceId: { not: null }
          }
        ],
        postCategory: {
          spaceId
        }
      }
    }),
    prisma.spacePermission.deleteMany({
      where: {
        OR: [
          {
            roleId: { not: null }
          },
          {
            spaceId: { not: null }
          }
        ],
        forSpaceId: spaceId
      }
    })
  ];
}
