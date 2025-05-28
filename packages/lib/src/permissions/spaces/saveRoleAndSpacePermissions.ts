import type { SpaceOperation } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError, MissingDataError } from '@packages/utils/errors';
import { isTruthy } from '@packages/utils/types';
import { v4 as uuid } from 'uuid';

import type { SpacePermissions } from './listPermissions';

export async function saveRoleAndSpacePermissions(spaceId: string, permissions: SpacePermissions) {
  const memberPermissions = permissions.space.filter((p) => p.assignee.group === 'space');

  const roleIds = Array.from(
    new Set(
      [
        ...memberPermissions.map((p) => p.assignee.id),
        ...permissions.forumCategories
          .filter((p) => p.assignee.group === 'role' || p.assignee.group === 'space')
          .map((p) =>
            p.assignee.group === 'role' ? p.assignee.id : p.assignee.group === 'space' ? p.assignee.id : undefined
          )
      ].filter(isTruthy)
    )
  );

  if (roleIds.length > 0) {
    const roles = await prisma.role.findMany({
      where: {
        archived: false,
        id: { in: roleIds }
      }
    });

    if (roles.length !== roleIds.length) {
      throw new InvalidInputError('Archived roles are not allowed to be used in permissions');
    }
  }

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
    ...permissions.forumCategories
      // Since we delete role and space permissions only, we should also only recreate role and space permissions
      .filter(
        (categoryPermission) =>
          categoryPermission.assignee.group === 'role' || categoryPermission.assignee.group === 'space'
      )
      .map((permission) =>
        prisma.postCategoryPermission.create({
          data: {
            id: permission.id ?? uuid(),
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
