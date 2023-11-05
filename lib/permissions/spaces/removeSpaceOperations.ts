import { prisma } from '@charmverse/core/prisma-client';

import type { AssignablePermissionGroups } from '../interfaces';

import { AvailableSpacePermissions } from './availableSpacePermissions';
import { computeGroupSpacePermissions } from './computeGroupSpacePermissions';
import type { SpacePermissionFlags, SpacePermissionModification } from './interfaces';
import { generateSpacePermissionQuery } from './utils';

/**
 * Returns true if the operation had an effect, false if nothing changed
 * @param param0
 * @returns
 */
export async function removeSpaceOperations<A extends AssignablePermissionGroups = 'any'>({
  forSpaceId,
  operations,
  roleId,
  spaceId,
  userId
}: SpacePermissionModification<A>): Promise<SpacePermissionFlags> {
  const query = generateSpacePermissionQuery({
    forSpaceId,
    roleId,
    spaceId,
    userId
  });

  const existingPermission = await prisma.spacePermission.findUnique({
    where: query
  });

  if (!existingPermission) {
    return new AvailableSpacePermissions().empty;
  }

  const assignedOperations = existingPermission.operations.slice();

  const filteredOperations = assignedOperations.filter((op) => {
    // Return only operations not targeted by this delete action
    return operations.indexOf(op) === -1;
  });

  if (filteredOperations.length === 0) {
    await prisma.spacePermission.delete({
      where: query
    });
  } else if (filteredOperations.length < assignedOperations.length) {
    await prisma.spacePermission.update({
      where: query,
      data: {
        operations: {
          set: filteredOperations
        }
      }
    });
  }

  const group: AssignablePermissionGroups = spaceId ? 'space' : roleId ? 'role' : 'user';
  const id = (group === 'space' ? spaceId : group === 'role' ? roleId : userId) as string;

  const updatedGroupSpacePermissions = await computeGroupSpacePermissions({
    resourceId: forSpaceId,
    group,
    id
  });

  return updatedGroupSpacePermissions;
}
