import { prisma } from 'db';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

type AbstractPermission<P extends string = string> = {
  spaceId?: string | null;
  roleId?: string | null;
  userId?: string | null;
  public?: boolean | null;
  permissionLevel: P;
};
// /**
//  * Compare a set of permissions with same specificity to get the highest one
//  *
//  * This relies on the paradigm of a permission mapping where higher permission levels always include all operations available to lower permission levels
//  *
//  * @abstract When we support custom permissions in future, we should probably refactor this to return an array of permissions
//  */
// function findGreatestPermission({ permissions, mapping }: PermissionCompareInput): AbstractPermission | null {
//   const permissionCount = permissions.length;

//   if (!permissions || permissionCount === 0) {
//     return null;
//   } else if (permissionCount === 1) {
//     return permissions[0];
//   }

//   let highestPermission = permissions[0];

//   for (let i = 1; i < permissionCount; i++) {
//     const currentPermission = permissions[i];

//     // Check if this permission provides access to more operations
//     if (mapping[currentPermission.permissionLevel].length > mapping[highestPermission.permissionLevel].length) {
//       highestPermission = currentPermission;
//     }
//   }
// }

type PermissionFilterInput<P extends string = string> = {
  permissions: AbstractPermission<P>[];
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
export async function filterApplicablePermissions<P extends string = string>({
  permissions,
  userId,
  resourceSpaceId
}: PermissionFilterInput<P>): Promise<AbstractPermission<P>[]> {
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
    { role: [], user: [], space: [], public: [] } as Record<
      'role' | 'user' | 'public' | 'space',
      AbstractPermission<P>[]
    >
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
