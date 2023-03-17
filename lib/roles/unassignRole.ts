import type { SpaceRole } from '@prisma/client';

import { prisma } from 'db';
import { InvalidInputError, UndesirableOperationError } from 'lib/utilities/errors';

import type { RoleAssignment } from './interfaces';
import { listRoleMembers } from './listRoleMembers';

export async function unassignRole({ roleId, userId }: RoleAssignment) {
  const role = await listRoleMembers({ roleId });

  if (role.users.every((u) => u.id !== userId)) {
    throw new InvalidInputError('User is not assigned to this role and cannot be removed from it.');
  }

  if (role.source === 'guild_xyz') {
    throw new UndesirableOperationError('Cannot remove role as it is managed by Guild.xyz');
  }

  const targetSpaceRole = (await prisma.spaceRole.findFirst({
    where: {
      userId,
      spaceRoleToRole: {
        some: {
          roleId: role.id
        }
      }
    }
  })) as SpaceRole;

  await prisma.spaceRoleToRole.delete({
    where: {
      spaceRoleId_roleId: {
        spaceRoleId: targetSpaceRole.id,
        roleId: role.id
      }
    }
  });
}
