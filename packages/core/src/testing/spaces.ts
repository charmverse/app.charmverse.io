import type { Prisma, SpacePermission } from '@charmverse/core/prisma-client';
import { SpaceOperation, prisma } from '@charmverse/core/prisma-client';

import { InsecureOperationError, InvalidInputError, InvalidPermissionGranteeError } from '../errors';

export async function addSpaceOperations({
  forSpaceId,
  operations,
  roleId,
  spaceId,
  userId
}: Pick<SpacePermission, 'operations' | 'forSpaceId'> &
  Partial<Pick<SpacePermission, 'userId' | 'spaceId' | 'roleId'>>) {
  // Make sure one group has been assigned, not more, not 0
  if ((roleId && (spaceId || userId)) || (spaceId && userId) || (!roleId && !spaceId && !userId)) {
    throw new InvalidPermissionGranteeError();
  }

  const group = spaceId ? 'space' : roleId ? 'role' : 'user';
  const id = (group === 'space' ? spaceId : group === 'role' ? roleId : userId) as string;

  for (const op of operations) {
    if (!SpaceOperation[op]) {
      throw new InvalidInputError(`Operation ${op} is an invalid space operation.`);
    }
  }

  // Validate the assignee
  // Make sure user is a space member
  if (userId) {
    const spaceRole = await prisma.spaceRole.findFirst({
      where: {
        userId,
        spaceId: forSpaceId
      }
    });

    if (!spaceRole) {
      throw new InsecureOperationError('Permissions cannot be assigned to users who are not a member of the space.');
    }
  } else if (group === 'role') {
    // Make sure this role is part of the target space
    const roleInSpace = await prisma.role.findUnique({
      where: {
        id
      }
    });
    if (!roleInSpace || roleInSpace.spaceId !== forSpaceId) {
      throw new InsecureOperationError('Permissions cannot be assigned to roles which do not belong to the space.');
    }
  } else if (group === 'space' && id !== forSpaceId) {
    throw new InsecureOperationError(
      'Space permissions cannot be assigned to a different space than the target space.'
    );
  }

  const query: Prisma.SpacePermissionWhereUniqueInput =
    group === 'user'
      ? {
          userId_forSpaceId: {
            userId: id,
            forSpaceId
          }
        }
      : group === 'role'
        ? {
            roleId_forSpaceId: {
              roleId: id,
              forSpaceId
            }
          }
        : {
            spaceId_forSpaceId: {
              spaceId: id,
              forSpaceId
            }
          };

  await prisma.spacePermission.upsert({
    where: query,
    update: {
      operations: {
        push: operations
      }
    },
    create: {
      forSpace: {
        connect: {
          id: forSpaceId
        }
      },
      operations,
      role: group === 'role' ? { connect: { id: roleId as string } } : undefined,
      user: group === 'user' ? { connect: { id: userId as string } } : undefined,
      space: group === 'space' ? { connect: { id: spaceId as string } } : undefined
    },
    include: {
      role: true,
      space: true,
      user: true
    }
  });
}
