import { prisma } from 'db';
import { SpacePermissionModification } from './interfaces';
import { generateSpacePermissionQuery } from './utility';

/**
 * Returns true if the operation had an effect, false if nothing changed
 * @param param0
 * @returns
 */
export async function removeSpaceOperations ({ forSpaceId, operations, roleId, spaceId, userId }: SpacePermissionModification): Promise<boolean> {
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
    return false;
  }

  const assignedOperations = existingPermission.operations.slice();

  const filteredOperations = assignedOperations.filter(op => {
    // Return only operations not targeted by this delete action
    return operations.indexOf(op) === -1;
  });

  if (filteredOperations.length === 0) {
    await prisma.spacePermission.delete({
      where: query
    });

    return true;
  }
  else if (filteredOperations.length < assignedOperations.length) {
    await prisma.spacePermission.update({
      where: query,
      data: {
        operations: {
          set: filteredOperations
        }
      }
    });

    return true;
  }

  return false;

}
