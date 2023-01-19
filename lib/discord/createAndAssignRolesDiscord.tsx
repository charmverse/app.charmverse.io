import { getSpacesAndUserFromDiscord } from 'lib/discord/getSpaceAndUserFromDiscord';
import type { ExternalRole } from 'lib/roles';
import { createAndAssignRoles } from 'lib/roles/createAndAssignRoles';

export async function createAndAssignRolesDiscord({
  discordUserId,
  discordServerId,
  roles
}: {
  discordUserId: string;
  discordServerId: string;
  roles: ExternalRole[] | ExternalRole;
}) {
  const rolesToAdd = Array.isArray(roles) ? roles : [roles];
  const spacesData = await getSpacesAndUserFromDiscord({ discordUserId, discordServerId });

  return Promise.all(
    spacesData.map(({ space, user }) => createAndAssignRoles({ userId: user.id, spaceId: space.id, roles: rolesToAdd }))
  );
}
