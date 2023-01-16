import { getGuildRoles } from 'lib/collabland/collablandClient';
import { getSpaceAndUserFromDiscord } from 'lib/discord/getSpaceAndUserFromDiscord';
import type { ExternalRole } from 'lib/roles';
import { createAndAssignRoles } from 'lib/roles/createAndAssignRoles';

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
    const discordRoles = await getGuildRoles(discordServerId);
    const rolesToAdd = roleIdsToAdd
      .map((roleId) => discordRoles.find((role) => role.id === roleId))
      .filter(Boolean) as ExternalRole[];

    const { space, user } = await getSpaceAndUserFromDiscord({ discordUserId, discordServerId });

    return createAndAssignRoles({ userId: user.id, spaceId: space.id, roles: rolesToAdd });
  } catch (e) {
    return null;
  }
}
