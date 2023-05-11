import { InvalidInputError, prisma } from '@charmverse/core';

import { getSpacesAndUserFromDiscord } from 'lib/discord/getSpaceAndUserFromDiscord';
import { unassignRole } from 'lib/roles';

export async function unassignRolesDiscord({
  discordUserId,
  discordServerId,
  roles
}: {
  discordUserId: string;
  discordServerId: string;
  roles: string[] | string;
}) {
  const rolesToRemove = Array.isArray(roles) ? roles : [roles];
  const spacesAndUser = await getSpacesAndUserFromDiscord({ discordUserId, discordServerId });
  if (!spacesAndUser) {
    return;
  }

  const { user } = spacesAndUser[0];

  const removeRoles = await prisma?.role.findMany({
    where: { externalId: { in: rolesToRemove.map((role) => String(role)) } }
  });

  for (const role of removeRoles) {
    try {
      await unassignRole({ userId: user.id, roleId: role.id });
    } catch (error) {
      if (error instanceof InvalidInputError) {
        return;
      }

      throw error;
    }
  }
}
