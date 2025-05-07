import { hasAccessToSpace } from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';

import type { MaybeString } from 'charmClient/hooks/helpers';

export async function canAccessDocusign({
  spaceId,
  userId
}: {
  userId: MaybeString;
  spaceId: string;
}): Promise<boolean> {
  if (!userId) {
    return false;
  }

  const { spaceRole } = await hasAccessToSpace({
    spaceId,
    userId
  });

  if (!spaceRole) {
    return false;
  }

  if (spaceRole.isAdmin) {
    return true;
  }

  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    select: {
      docusignAllowedRoleOrUsers: true
    }
  });

  // The space has not restricted roles or users, so the user can access docusign
  if (!space.docusignAllowedRoleOrUsers.length) {
    return true;
  }

  if (space.docusignAllowedRoleOrUsers.some((allowedUserOrRole) => allowedUserOrRole.userId === userId)) {
    return true;
  }

  const allowedRoles = space.docusignAllowedRoleOrUsers.filter((allowedUserOrRole) => allowedUserOrRole.roleId);
  if (!allowedRoles.length) {
    return false;
  }
  const matchingRole = await prisma.spaceRoleToRole.findFirst({
    where: {
      roleId: {
        in: allowedRoles.map((allowedUserOrRole) => allowedUserOrRole.roleId as string)
      },
      spaceRole: {
        userId,
        spaceId
      }
    }
  });

  if (matchingRole) {
    return true;
  }

  return false;
}
