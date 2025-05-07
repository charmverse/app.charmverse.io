import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/utils/errors';

import type { AssignablePermissionGroups } from '../interfaces';

import { AvailableSpacePermissions } from './availableSpacePermissions';
import type { SpacePermissionFlags } from './interfaces';

/**
 * @id The userId, roleId or spaceId
 * @resourceId The resource such as Space or Page we are querying permissions for
 */
interface AssignedPermissionsQuery {
  group: AssignablePermissionGroups;
  id: string;
  resourceId: string;
}

export async function computeGroupSpacePermissions({
  id,
  group,
  resourceId
}: AssignedPermissionsQuery): Promise<SpacePermissionFlags> {
  if (!id || !permissionGroupIsValid(group) || !resourceId) {
    throw new InvalidInputError('Please verify your input for requesting computation of space permissions.');
  }

  const permissionsToReturn = new AvailableSpacePermissions();

  // Prevent space permissions going to other spaces
  if (group === 'space' && id === resourceId) {
    const spacePermissions = await prisma.spacePermission.findUnique({
      where: {
        spaceId_forSpaceId: {
          spaceId: id,
          forSpaceId: resourceId
        }
      }
    });
    if (spacePermissions) {
      permissionsToReturn.addPermissions(spacePermissions.operations);
    }
  } else if (group === 'role') {
    const rolePermissions = await prisma.spacePermission.findUnique({
      where: {
        roleId_forSpaceId: {
          roleId: id,
          forSpaceId: resourceId
        }
      },
      include: {
        role: true
      }
    });
    // Only take into account roles assigned to the space
    if (rolePermissions && rolePermissions.role?.spaceId === resourceId) {
      permissionsToReturn.addPermissions(rolePermissions.operations);
    }
  } else if (group === 'user') {
    const userPermissions = await prisma.spacePermission.findUnique({
      where: {
        userId_forSpaceId: {
          userId: id,
          forSpaceId: resourceId
        }
      }
    });
    if (userPermissions) {
      permissionsToReturn.addPermissions(userPermissions.operations);
    }
  }

  // This last return should never be reached, as one of 3 previous
  return permissionsToReturn.operationFlags;
}

function permissionGroupIsValid(group: AssignablePermissionGroups): boolean {
  if (group !== 'role' && group !== 'space' && group !== 'user') {
    return false;
  }

  return true;
}
