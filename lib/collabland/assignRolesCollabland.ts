import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

import { findOrCreateCollablandRoles } from 'lib/collabland/findOrCreateCollablandRoles';
import { getSpacesAndUserFromDiscord } from 'lib/discord/getSpaceAndUserFromDiscord';

export async function assignRolesCollabland({
  discordUserId,
  discordServerId,
  roles
}: {
  discordUserId: string;
  discordServerId: string;
  roles: string[] | string;
}) {
  const roleIdsToAdd = Array.isArray(roles) ? roles : [roles];
  const spacesData = await getSpacesAndUserFromDiscord({ discordUserId, discordServerId });

  if (!spacesData) {
    return;
  }

  return Promise.allSettled(
    spacesData.map(({ space, user }) =>
      createAndAssignCollablandRoles({ userId: user.id, spaceId: space.id, roles: roleIdsToAdd })
    )
  );
}

async function createAndAssignCollablandRoles({
  userId,
  spaceId,
  roles
}: {
  userId: string;
  spaceId: string;
  roles: string[];
}) {
  if (!roles.length) {
    return;
  }

  const spaceMembership = await prisma.spaceRole.findFirst({
    where: {
      spaceId,
      userId
    }
  });

  if (!spaceMembership) {
    return;
  }

  const rolesRecord = await findOrCreateCollablandRoles({
    externalRoleIds: roles,
    spaceId
  });

  const roleIdsToAssign: string[] = [];
  roles.forEach((roleId) => {
    const role = rolesRecord[roleId];
    if (role) {
      roleIdsToAssign.push(role.id);
    }
  });

  if (roleIdsToAssign.length) {
    log.info(`Assigning roles to space member`, { userId, spaceId, roleIdsToAssign });
  }

  await prisma.$transaction(
    roleIdsToAssign.map((roleId) => {
      // assign roles to user
      return prisma.spaceRoleToRole.upsert({
        where: {
          spaceRoleId_roleId: {
            spaceRoleId: spaceMembership.id,
            roleId
          }
        },
        create: {
          role: {
            connect: {
              id: roleId
            }
          },
          spaceRole: {
            connect: {
              id: spaceMembership.id
            }
          }
        },
        // Perform an empty update if user already has the role
        update: {}
      });
    })
  );
  return { userId, spaceId };
}
