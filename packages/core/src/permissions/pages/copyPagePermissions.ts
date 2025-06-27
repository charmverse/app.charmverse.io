import type { PagePermission, Prisma } from '@charmverse/core/prisma-client';

import { InvalidPermissionGranteeError } from '../../errors/permissions';

/**
 * Copy an existing permission and convert it to a Prisma upsert argument
 * @inheritFrom Set this to true to establish an inheritance reference
 */
export function copyPagePermission({
  pagePermission,
  newPageId,
  inheritFrom
}: {
  pagePermission: PagePermission;
  newPageId: string;
  inheritFrom: boolean;
}): Prisma.PagePermissionCreateInput {
  // Ensure only one group is assigned to this permission
  if (
    (pagePermission.public && (pagePermission.userId || pagePermission.roleId || pagePermission.spaceId)) ||
    (pagePermission.userId && (pagePermission.roleId || pagePermission.spaceId)) ||
    (pagePermission.roleId && pagePermission.spaceId) ||
    (!pagePermission.userId && !pagePermission.roleId && !pagePermission.spaceId && !pagePermission.public)
  ) {
    throw new InvalidPermissionGranteeError();
  }

  const inheritanceValue = inheritFrom ? (pagePermission.inheritedFromPermission ?? pagePermission.id) : undefined;

  return {
    page: {
      connect: {
        id: newPageId
      }
    },
    permissionLevel: pagePermission.permissionLevel,
    public: pagePermission.public ? true : undefined,
    sourcePermission: inheritanceValue
      ? {
          connect: {
            id: inheritanceValue
          }
        }
      : undefined,
    space: pagePermission.spaceId
      ? {
          connect: {
            id: pagePermission.spaceId
          }
        }
      : undefined,
    role: pagePermission.roleId
      ? {
          connect: {
            id: pagePermission.roleId
          }
        }
      : undefined,
    user: pagePermission.userId
      ? {
          connect: {
            id: pagePermission.userId
          }
        }
      : undefined
  };
}

export function copyAllPagePermissions({
  permissions,
  newPageId,
  inheritFrom
}: {
  permissions: PagePermission[];
  newPageId: string;
  inheritFrom: boolean;
}): Prisma.PagePermissionCreateManyArgs {
  return {
    data: permissions.map((p) => {
      const copied = copyPagePermission({ pagePermission: p, newPageId, inheritFrom });

      return {
        pageId: newPageId,
        permissionLevel: copied.permissionLevel,
        inheritedFromPermission: copied.sourcePermission?.connect?.id,
        public: copied.public,
        spaceId: copied.space?.connect?.id,
        roleId: copied.role?.connect?.id,
        userId: copied.user?.connect?.id
      };
    })
  };
}
