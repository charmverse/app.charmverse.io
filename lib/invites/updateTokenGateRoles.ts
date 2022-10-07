import { prisma } from 'db';

export async function updateInviteLinkRoles (roleIds: string[], inviteLinkId: string) {
  const roleIdsSet = new Set(roleIds);

  const inviteLinkRoles = await prisma.inviteLinkToRole.findMany({
    where: {
      inviteLinkId
    },
    select: {
      roleId: true
    }
  });

  const inviteLinkRoleIds = new Set(inviteLinkRoles.map(role => role.roleId));
  const inviteLinkRoleIdsToAdd = roleIds.filter(roleId => !inviteLinkRoleIds.has(roleId));
  const inviteLinkRoleIdsToRemove = Array.from(inviteLinkRoleIds).filter(inviteLinkRoleId => !roleIdsSet.has(inviteLinkRoleId));

  if (inviteLinkRoleIdsToAdd.length !== 0) {
    await prisma.inviteLinkToRole.createMany({
      data: inviteLinkRoleIdsToAdd.map(inviteLinkRoleIdToAdd => ({
        roleId: inviteLinkRoleIdToAdd,
        inviteLinkId
      }))
    });
  }

  if (inviteLinkRoleIdsToRemove.length !== 0) {
    await prisma.inviteLinkToRole.deleteMany({
      where: {
        inviteLinkId,
        roleId: {
          in: inviteLinkRoleIdsToRemove
        }
      }
    });
  }

  // Return the updated inviteLink to role records attached with the token gate
  // This will help in updating the cache on the client side
  const inviteLinkToRoles = await prisma.inviteLinkToRole.findMany({
    where: {
      inviteLinkId
    }
  });

  return inviteLinkToRoles;
}
