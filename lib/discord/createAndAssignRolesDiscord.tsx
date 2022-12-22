import { getSpaceAndUserFromDiscord } from 'lib/discord/getSpaceAndUserFromDiscord';
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
  const { space, user } = await getSpaceAndUserFromDiscord({ discordUserId, discordServerId });

  return createAndAssignRoles({ userId: user.id, spaceId: space.id, roles: rolesToAdd });
}
