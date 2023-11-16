import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

import { unassignRole } from 'lib/roles';

import { getSpacesAndUserFromDiscord } from './getSpaceAndUserFromDiscord';

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

  for (const spaceAndUser of spacesAndUser) {
    const { user } = spaceAndUser;
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

  return { userId: spacesAndUser[0].user.id, spaceIds: spacesAndUser.map(({ space }) => space.id) };
}
