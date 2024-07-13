import type { ExternalRole } from '@root/lib/roles';
import { createAndAssignRoles } from '@root/lib/roles/createAndAssignRoles';

import { getSpacesAndUserFromDiscord } from './getSpaceAndUserFromDiscord';

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

  if (!spacesData) {
    return;
  }

  return Promise.all(
    spacesData.map(({ space, user }) => createAndAssignRoles({ userId: user.id, spaceId: space.id, roles: rolesToAdd }))
  );
}
