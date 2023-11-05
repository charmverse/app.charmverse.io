import { DataNotFoundError, InsecureOperationError, InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { arrayUtils } from '@charmverse/core/utilities';

import type { InviteLinkWithRoles } from './getSpaceInviteLinks';

export type InviteLinkRolesUpdate = {
  inviteLinkId: string;
  roleIds: string[];
};

export async function updateInviteLinkRoles({
  inviteLinkId,
  roleIds
}: InviteLinkRolesUpdate): Promise<InviteLinkWithRoles> {
  if (!inviteLinkId || !roleIds) {
    throw new InvalidInputError(`Valid invite link ID and role IDs are required`);
  }

  const roleIdsSet = arrayUtils.uniqueValues(roleIds);

  const inviteLink = await prisma.inviteLink.findUnique({
    where: {
      id: inviteLinkId
    }
  });

  if (!inviteLink) {
    throw new DataNotFoundError(`Invite link with id ${inviteLinkId} not found`);
  }

  const updatedInviteLink = await prisma.$transaction(async (tx) => {
    await tx.inviteLinkToRole.deleteMany({
      where: {
        inviteLinkId
      }
    });
    if (roleIdsSet.length > 0) {
      const rolesInSpace = await tx.role.findMany({
        where: {
          id: {
            in: roleIdsSet
          },
          spaceId: inviteLink.spaceId
        }
      });

      if (rolesInSpace.length !== roleIdsSet.length) {
        throw new InsecureOperationError(`One or more roles do not exist in the space`);
      }

      await tx.inviteLinkToRole.createMany({
        data: roleIdsSet.map((roleId) => ({ inviteLinkId, roleId }))
      });
    }
    return { ...inviteLink, roleIds: roleIdsSet };
  });

  return updatedInviteLink;
}
