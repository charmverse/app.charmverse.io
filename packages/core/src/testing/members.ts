import type {
  InviteLink,
  InviteLinkToRole,
  Prisma,
  PublicInviteLinkContext,
  Role,
  RoleSource,
  SpaceOperation
} from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { InvalidInputError } from '../errors';
import { uniqueValues } from '../lib/utilities/array';

/**
 * @roleName uses UUID to ensure role names do not conflict
 */
export async function generateRole({
  externalId,
  spaceId,
  createdBy,
  roleName = `role-${v4()}`,
  source,
  assigneeUserIds,
  id = v4(),
  spacePermissions
}: {
  externalId?: string;
  spaceId: string;
  roleName?: string;
  createdBy: string;
  source?: RoleSource;
  id?: string;
  assigneeUserIds?: string[];
  spacePermissions?: SpaceOperation[];
}): Promise<Role> {
  const assignUsers = assigneeUserIds && assigneeUserIds.length >= 1;

  const roleAssignees: Omit<Prisma.SpaceRoleToRoleCreateManyInput, 'roleId'>[] = [];

  // check assignees
  if (assignUsers) {
    const uniqueIds = uniqueValues(assigneeUserIds);

    const spaceRoles = await prisma.spaceRole.findMany({
      where: {
        spaceId,
        userId: {
          in: uniqueIds
        }
      }
    });

    if (spaceRoles.length !== uniqueIds.length) {
      throw new InvalidInputError(`Cannot assign role to a user not inside the space`);
    }

    roleAssignees.push(...spaceRoles.map((sr) => ({ spaceRoleId: sr.id })));
  }

  const role = await prisma.role.create({
    data: {
      id,
      externalId,
      name: roleName,
      createdBy,
      space: {
        connect: {
          id: spaceId
        }
      },
      source,
      spaceRolesToRole:
        roleAssignees.length > 0
          ? {
              createMany: {
                data: roleAssignees
              }
            }
          : undefined
    }
  });

  if (spacePermissions && spacePermissions.length > 0) {
    await prisma.spacePermission.create({
      data: {
        forSpace: { connect: { id: spaceId } },
        role: { connect: { id: role.id } },
        operations: spacePermissions
      }
    });
  }

  return role;
}
export async function generateInviteLink({
  createdBy,
  createdAt,
  spaceId,
  maxAgeMinutes,
  maxUses,
  useCount,
  visibleOn,
  assignedRoleIds
}: {
  spaceId: string;
  createdBy: string;
  createdAt?: Date;
  maxAgeMinutes?: number;
  maxUses?: number;
  useCount?: number;
  visibleOn?: PublicInviteLinkContext;
  assignedRoleIds?: string[];
}): Promise<InviteLink & { inviteLinkToRoles: InviteLinkToRole[] }> {
  return prisma.inviteLink.create({
    data: {
      code: `code-${v4()}`,
      createdBy,
      createdAt,
      maxAgeMinutes,
      maxUses,
      useCount,
      spaceId,
      visibleOn,
      inviteLinkToRoles: assignedRoleIds ? { create: assignedRoleIds.map((roleId) => ({ roleId })) } : undefined
    },
    include: {
      inviteLinkToRoles: true
    }
  });
}
