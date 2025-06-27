import type { DocusignAllowedRoleOrUser } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { InsecureOperationError, InvalidInputError } from '@packages/core/errors';
import { stringUtils } from '@packages/core/utilities';

export async function getAllowedDocusignRolesAndUsers({
  spaceId
}: {
  spaceId: string;
}): Promise<DocusignAllowedRoleOrUser[]> {
  if (!stringUtils.isUUID(spaceId)) {
    throw new InvalidInputError('Invalid spaceId');
  }

  const allowedUsersAndRoles = await prisma.docusignAllowedRoleOrUser.findMany({
    where: {
      spaceId
    }
  });

  return allowedUsersAndRoles;
}

type AllowedDocusignRolesAndUsersPayload = Partial<Pick<DocusignAllowedRoleOrUser, 'roleId' | 'userId'>>;

export type AllowedDocusignRolesAndUsersUpdate = {
  spaceId: string;
  allowedRolesAndUsers: AllowedDocusignRolesAndUsersPayload[];
};

export async function updateAllowedDocusignRolesAndUsers({
  spaceId,
  allowedRolesAndUsers
}: AllowedDocusignRolesAndUsersUpdate): Promise<DocusignAllowedRoleOrUser[]> {
  if (!stringUtils.isUUID(spaceId)) {
    throw new InvalidInputError('Invalid spaceId');
  }

  const selectedUsers = allowedRolesAndUsers
    .filter((allowedUserOrRole) => !!allowedUserOrRole.userId)
    .map((role) => ({ userId: role.userId }));

  const usersInSpace = await prisma.spaceRole.findMany({
    where: {
      spaceId,
      userId: {
        in: selectedUsers.map((user) => user.userId as string)
      }
    },
    select: {
      userId: true
    }
  });

  if (selectedUsers.some((user) => !usersInSpace.find((u) => u.userId === user.userId))) {
    throw new InsecureOperationError(`User must be a space member to manage documents`);
  }

  const selectedRoles = allowedRolesAndUsers
    .filter((allowedUserOrRole) => !!allowedUserOrRole.roleId)
    .map((role) => ({ roleId: role.roleId }));

  const rolesInSpace = await prisma.role.findMany({
    where: {
      spaceId,
      id: {
        in: selectedRoles.map((role) => role.roleId as string)
      }
    }
  });

  if (selectedRoles.some((role) => !rolesInSpace.find((r) => r.id === role.roleId))) {
    throw new InsecureOperationError(`Role must be a space role to manage documents`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.docusignAllowedRoleOrUser.deleteMany({
      where: {
        spaceId
      }
    });

    await tx.docusignAllowedRoleOrUser.createMany({
      data: [...selectedUsers, ...selectedRoles].map((role) => ({ ...role, spaceId }))
    });
  });

  return getAllowedDocusignRolesAndUsers({ spaceId });
}
