import type { SpaceRole } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidStateError } from '@packages/nextjs/errors';
import { hasAccessToSpace } from '@packages/users/hasAccessToSpace';
import { DataNotFoundError, InsecureOperationError, UndesirableOperationError } from '@packages/utils/errors';

import type { RoleAssignment } from './interfaces';
import { listRoleMembers } from './listRoleMembers';

export async function assignRole({ roleId, userId }: RoleAssignment) {
  const userExists = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      id: true
    }
  });

  if (!userExists) {
    throw new DataNotFoundError(`User with id ${userId} not found.`);
  }

  const role = await listRoleMembers({ roleId });

  if (role?.source === 'summon') {
    throw new UndesirableOperationError('Cannot assign role imported from summon');
  }

  // User is already a member
  if (role.users.some((u) => u.id === userId)) {
    return;
  }

  const { error, spaceRole } = await hasAccessToSpace({
    spaceId: role.spaceId,
    userId,
    adminOnly: false
  });

  if (error) {
    throw new InsecureOperationError('Roles cannot be assigned to users from outside this space');
  }

  if (spaceRole?.isGuest) {
    throw new InvalidStateError('Guests cannot be assigned roles');
  }

  await prisma.spaceRoleToRole.create({
    data: {
      role: {
        connect: {
          id: role.id
        }
      },
      spaceRole: {
        connect: {
          id: (spaceRole as SpaceRole).id
        }
      }
    }
  });
}
