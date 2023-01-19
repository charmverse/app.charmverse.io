import { getGuildRoles } from 'lib/collabland/collablandClient';
import { getSpacesAndUserFromDiscord } from 'lib/discord/getSpaceAndUserFromDiscord';
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

    const spacesData = await getSpacesAndUserFromDiscord({ discordUserId, discordServerId });

    return Promise.allSettled(
      spacesData.map(({ space, user }) =>
        createAndAssignRoles({ userId: user.id, spaceId: space.id, roles: rolesToAdd })
      )
    );
  } catch (e) {
    return null;
  }
}
