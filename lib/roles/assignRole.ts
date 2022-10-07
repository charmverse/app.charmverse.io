import type { SpaceRole } from '@prisma/client';

import { prisma } from 'db';
import { DataNotFoundError, InsecureOperationError } from 'lib/utilities/errors';

import { hasAccessToSpace } from '../middleware';

import type { RoleAssignment, RoleWithMembers } from './interfaces';
import { listRoleMembers } from './listRoleMembers';

export async function assignRole ({ roleId, userId }: RoleAssignment): Promise<RoleWithMembers> {

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
  if (role.users.find(u => u.id === userId)) {
    return role;
  }

  const { error, spaceRole } = await hasAccessToSpace({
    spaceId: role.spaceId,
    userId,
    adminOnly: false
  });

  if (error) {
    throw new InsecureOperationError('Roles cannot be assigned to users from outside this space');
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

  const updatedRoleMembers = await listRoleMembers({
    roleId
  });

  return updatedRoleMembers;

}
