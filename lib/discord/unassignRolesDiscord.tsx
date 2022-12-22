import { prisma } from 'db';
import { getSpaceAndUserFromDiscord } from 'lib/discord/getSpaceAndUserFromDiscord';
import type { ExternalRole } from 'lib/roles';
import { unassignRole } from 'lib/roles';

export async function unassignRolesDiscord({
  discordUserId,
  discordServerId,
  roles
}: {
  discordUserId: string;
  discordServerId: string;
  roles: ExternalRole[] | ExternalRole;
}) {
  const rolesToRemove = Array.isArray(roles) ? roles : [roles];
  const { user } = await getSpaceAndUserFromDiscord({ discordUserId, discordServerId });
  const removeRoles = await prisma?.role.findMany({
    where: { externalId: { in: rolesToRemove.map((role) => String(role.id)) } }
  });

  for (const role of removeRoles) {
    await unassignRole({ userId: user.id, roleId: role.id });
  }
}
