import type { Role, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { DataNotFoundError } from '@packages/utils/errors';

export type RoleWithMembers = Role & { users: User[] };

export async function listRoleMembers({ roleId }: { roleId: string }): Promise<RoleWithMembers> {
  const role = await prisma.role.findFirst({
    where: {
      id: roleId
    },
    include: {
      spaceRolesToRole: {
        include: {
          spaceRole: {
            include: {
              user: true
            }
          }
        }
      }
    }
  });

  if (!role) {
    throw new DataNotFoundError(`Role with id ${roleId} not found.`);
  }

  const roleWithAssignedUsers: RoleWithMembers = {
    ...role,
    users: role.spaceRolesToRole.map((_) => {
      return _.spaceRole.user;
    })
  };

  return roleWithAssignedUsers;
}
