import { prisma } from '@charmverse/core/prisma-client';
import { hasAccessToSpace } from '@packages/users/hasAccessToSpace';

export type AbstractPermission = {
  spaceId?: string | null;
  roleId?: string | null;
  userId?: string | null;
  public?: boolean | null;
};

type PermissionFilterInput<T extends AbstractPermission> = {
  permissions: T[];
  userId?: string;
  resourceSpaceId: string;
};

/**
 * Apply permissions to a user in decreasing order of specificity
 *
 * The highest permission in a level of specificity is always chosen. For simplicity, we can just return all permissions for that level, since all attached operations will be added
 *
 * @P - The permission level enum type which groups underlying operations ie. "full_access"
 */
export async function filterApplicablePermissions<T extends AbstractPermission>({
  permissions,
  userId,
  resourceSpaceId
}: PermissionFilterInput<T>): Promise<T[]> {
  // Iterate once through permissions to group them and avoid duplicate array traversal
  const permissionMap = permissions.reduce(
    (acc, val) => {
      if (val.public) {
        acc.public.push(val);
      } else if (val.userId) {
        acc.user.push(val);
      } else if (val.roleId) {
        acc.role.push(val);
      } else if (val.spaceId) {
        acc.space.push(val);
      }
      return acc;
    },
    { role: [], user: [], space: [], public: [] } as Record<'role' | 'user' | 'public' | 'space', T[]>
  );

  const { spaceRole } = await hasAccessToSpace({
    spaceId: resourceSpaceId,
    userId
  });

  if (!userId || !spaceRole) {
    return permissionMap.public;
  }

  if (permissionMap.user.length > 0) {
    const applicableUserPermissions = permissionMap.user.filter((p) => p.userId === userId);
    if (applicableUserPermissions.length > 0) {
      return applicableUserPermissions;
    }
  }

  if (permissionMap.role.length > 0) {
    const roleIds = permissionMap.role.map((p) => p.roleId as string);
    const applicableRoles = await prisma.spaceRoleToRole.findMany({
      where: {
        roleId: {
          in: roleIds
        },
        // Only match against assigned roles for the same space as the resource
        spaceRoleId: spaceRole.id
      }
    });

    const applicablePermissionsByRole = permissionMap.role.filter((p) =>
      applicableRoles.some((r) => r.roleId === p.roleId)
    );

    if (applicablePermissionsByRole.length > 0) {
      return applicablePermissionsByRole;
    }
  }

  const spacePermission = permissionMap.space.find((p) => p.spaceId === resourceSpaceId);

  if (spacePermission) {
    return [spacePermission];
  }

  return permissionMap.public;
}
