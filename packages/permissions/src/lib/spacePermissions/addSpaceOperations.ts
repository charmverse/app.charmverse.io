import type { Prisma } from '@charmverse/core/prisma';
import { SpaceOperation } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { InsecureOperationError, InvalidInputError, MissingDataError } from '@packages/core/errors';
import type { SpacePermissionAssignment } from '@packages/core/permissions';
import { hasAccessToSpace } from '@packages/core/permissions';
import { arrayUtils } from '@packages/core/utilities';

import { AssignableToRolesOnlyError } from 'lib/corePermissions';

export async function addSpaceOperations({ resourceId, operations, assignee }: SpacePermissionAssignment) {
  if (!operations || !(operations instanceof Array) || operations.length === 0) {
    throw new MissingDataError('You must provide at least 1 operation.');
  }

  for (const op of operations) {
    if (!SpaceOperation[op]) {
      throw new InvalidInputError(`Operation ${op} is an invalid space operation.`);
    } else if (op === 'moderateForums' && assignee.group !== 'role') {
      throw new AssignableToRolesOnlyError(op);
    }
  }

  // Validate the assignee
  // Make sure user is a space member
  if (assignee.group === 'user') {
    const { spaceRole } = await hasAccessToSpace({
      spaceId: resourceId,
      userId: assignee.id
    });

    if (!spaceRole) {
      throw new InsecureOperationError('Permissions cannot be assigned to users who are not a member of the space.');
    }
  } else if (assignee.group === 'role') {
    // Make sure this role is part of the target space
    const roleInSpace = await prisma.role.findUnique({
      where: {
        id: assignee.id
      }
    });
    if (!roleInSpace || roleInSpace.spaceId !== resourceId) {
      throw new InsecureOperationError('Permissions cannot be assigned to roles which do not belong to the space.');
    }
  } else if (assignee.group === 'space' && assignee.id !== resourceId) {
    throw new InsecureOperationError(
      'Space permissions cannot be assigned to a different space than the target space.'
    );
  }

  const query: Prisma.SpacePermissionWhereUniqueInput = {
    id: resourceId,
    roleId: assignee.group === 'role' ? assignee.id : undefined,
    userId: assignee.group === 'user' ? assignee.id : undefined,
    spaceId: assignee.group === 'space' ? assignee.id : undefined
  };

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
  const deduplicatedOperations = arrayUtils.uniqueValues(currentOperations);

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
          id: resourceId
        }
      },
      operations: deduplicatedOperations,
      role: assignee.group === 'role' ? { connect: { id: assignee.id } } : undefined,
      user: assignee.group === 'user' ? { connect: { id: assignee.id } } : undefined,
      space: assignee.group === 'space' ? { connect: { id: assignee.id } } : undefined
    },
    include: {
      role: true,
      space: true,
      user: true
    }
  });
}
