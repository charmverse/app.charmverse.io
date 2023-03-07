import { prisma } from 'db';
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

  try {
    const spacesData = await getSpacesAndUserFromDiscord({ discordUserId, discordServerId });
    return Promise.allSettled(
      spacesData.map(({ space, user }) =>
        createAndAssignCollablanRoles({ userId: user.id, spaceId: space.id, roles: roleIdsToAdd, discordServerId })
      )
    );
  } catch (e) {
    return null;
  }
}

async function createAndAssignCollablanRoles({
  userId,
  spaceId,
  roles,
  discordServerId
}: {
  userId: string;
  spaceId: string;
  roles: string[];
  discordServerId: string;
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
    spaceId,
    userId,
    discordServerId
  });

  const roleIdsToAssign: string[] = [];
  roles.forEach((roleId) => {
    const role = rolesRecord[roleId];
    if (role) {
      roleIdsToAssign.push(role.id);
    }
  });

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
}
