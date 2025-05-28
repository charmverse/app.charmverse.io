import { prisma } from '@charmverse/core/prisma-client';

export async function updateTokenGateRoles(roleIds: string[], tokenGateId: string) {
  const roleIdsSet = new Set(roleIds);

  const tokenGateRoles = await prisma.tokenGateToRole.findMany({
    where: {
      tokenGateId,
      role: {
        archived: false
      }
    },
    select: {
      roleId: true
    }
  });

  const tokenGateRoleIds = new Set(tokenGateRoles.map((role) => role.roleId));
  const tokenGateRoleIdsToAdd = roleIds.filter((roleId) => !tokenGateRoleIds.has(roleId));
  const tokenGateRoleIdsToRemove = Array.from(tokenGateRoleIds).filter(
    (tokenGateRoleId) => !roleIdsSet.has(tokenGateRoleId)
  );

  if (tokenGateRoleIdsToAdd.length !== 0) {
    await prisma.tokenGateToRole.createMany({
      data: tokenGateRoleIdsToAdd.map((tokenGateRoleIdToAdd) => ({
        roleId: tokenGateRoleIdToAdd,
        tokenGateId
      }))
    });
  }

  if (tokenGateRoleIdsToRemove.length !== 0) {
    await prisma.tokenGateToRole.deleteMany({
      where: {
        tokenGateId,
        roleId: {
          in: tokenGateRoleIdsToRemove
        }
      }
    });
  }

  // Return the updated tokenGate to role records attached with the token gate
  // This will help in updating the cache on the client side
  const tokenGateToRoles = await prisma.tokenGateToRole.findMany({
    where: {
      tokenGateId
    }
  });

  return tokenGateToRoles;
}
