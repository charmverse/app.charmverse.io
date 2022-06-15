import { InvalidInputError } from 'lib/utilities/errors';
import { prisma } from 'db';
import { AssignedPermissionsQuery, PermissionAssigneeId } from '../interfaces';
import { AvailableSpacePermissions } from './availableSpacePermissions';
import { SpacePermissionFlags } from './interfaces';

export async function computeGroupSpacePermissions ({ id, group, resourceId }:
  AssignedPermissionsQuery): Promise<SpacePermissionFlags> {

  const permissionsToReturn = new AvailableSpacePermissions();

  if (group === 'space') {
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
  }
  else if (group === 'role') {
    const rolePermissions = await prisma.spacePermission.findUnique({
      where: {
        roleId_forSpaceId: {
          roleId: id,
          forSpaceId: resourceId
        }
      }
    });
    if (rolePermissions) {
      permissionsToReturn.addPermissions(rolePermissions.operations);
    }

  }
  else if (group === 'user') {
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
  return permissionsToReturn;

}
