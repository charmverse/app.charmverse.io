import { Prisma, SpaceOperation } from '@prisma/client';

import { prisma } from 'db';
import { hasAccessToSpace } from 'lib/middleware';
import { uniqueValues } from 'lib/utilities/array';
import { InsecureOperationError, InvalidInputError, MissingDataError } from 'lib/utilities/errors';

import { InvalidPermissionGranteeError } from '../errors';
import type { AssignablePermissionGroups } from '../interfaces';

import { computeGroupSpacePermissions } from './computeGroupSpacePermissions';
import type { SpacePermissionFlags, SpacePermissionModification } from './interfaces';
import { SpacePermissionWithAssignee } from './interfaces';
import { generateSpacePermissionQuery } from './utility';

export async function addSpaceOperations<A extends AssignablePermissionGroups = 'any'> ({
  forSpaceId,
  operations,
  roleId,
  spaceId,
  userId
}: SpacePermissionModification<A>): Promise<SpacePermissionFlags> {

  // Make sure one group has been assigned, not more, not 0
  if ((roleId && (spaceId || userId))
  || (spaceId && userId)
  || (!roleId && !spaceId && !userId)) {
    throw new InvalidPermissionGranteeError();
  }

  const group: AssignablePermissionGroups = spaceId ? 'space' : roleId ? 'role' : 'user';
  const id = (group === 'space' ? spaceId : group === 'role' ? roleId : userId) as string;

  if (!operations || !(operations instanceof Array) || operations.length === 0) {
    throw new MissingDataError('You must provide at least 1 operation.');
  }

  for (const op of operations) {
    if (!SpaceOperation[op]) {
      throw new InvalidInputError(`Operation ${op} is an invalid space operation.`);
    }
  }

  // Validate the assignee
  // Make sure user is a space member
  if (group === 'user') {
    const { error } = await hasAccessToSpace({
      spaceId: forSpaceId,
      userId: id,
      adminOnly: false
    });

    if (error) {
      throw new InsecureOperationError('Permissions cannot be assigned to users who are not a member of the space.');
    }
  }
  else if (group === 'role') {
    // Make sure this role is part of the target space
    const roleInSpace = await prisma.role.findUnique({
      where: {
        id
      }
    });
    if (!roleInSpace || roleInSpace.spaceId !== forSpaceId) {
      throw new InsecureOperationError('Permissions cannot be assigned to roles which do not belong to the space.');
    }
  }
  else if (group === 'space' && id !== forSpaceId) {
    throw new InsecureOperationError('Space permissions cannot be assigned to a different space than the target space.');
  }

  const query = generateSpacePermissionQuery({
    forSpaceId,
    roleId,
    spaceId,
    userId
  });

  const existingPermission = await prisma.spacePermission.findUnique({
    where: query,
    select: {
      operations: true
    }
  });

  // We could use the prisma push API to add the operation, but instead we rebuild the list each time.
  // This allows us to validate the operations list
  const currentOperations = existingPermission?.operations ?? [];

  currentOperations.push(...operations);

  // Prevents us from adding the same operation twice
  const deduplicatedOperations = uniqueValues(currentOperations);

  await prisma.spacePermission.upsert({
    where: query,
    update: {
      operations: {
        set: deduplicatedOperations
      }
    },
    create: {
      forSpace: {
        connect: {
          id: forSpaceId
        }
      },
      operations: deduplicatedOperations,
      role: roleId ? {
        connect: {
          id: roleId
        }
      } : undefined,
      user: userId ? {
        connect: {
          id: userId
        }
      } : undefined,
      space: spaceId ? {
        connect: {
          id: spaceId
        }
      } : undefined
    },
    include: {
      role: true,
      space: true,
      user: true
    }
  });

  const updatedGroupSpacePermissions = await computeGroupSpacePermissions({
    resourceId: forSpaceId,
    group,
    id
  });

  return updatedGroupSpacePermissions;

}
