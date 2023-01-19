import { prisma } from 'db';
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
  const { user } = spacesAndUser[0];

  const removeRoles = await prisma?.role.findMany({
    where: { externalId: { in: rolesToRemove.map((role) => String(role)) } }
  });

  for (const role of removeRoles) {
    await unassignRole({ userId: user.id, roleId: role.id });
  }
}
