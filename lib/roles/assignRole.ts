import type { SpaceRole } from '@prisma/client';

import { prisma } from 'db';
import { InvalidStateError } from 'lib/middleware';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { DataNotFoundError, InsecureOperationError } from 'lib/utilities/errors';

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
