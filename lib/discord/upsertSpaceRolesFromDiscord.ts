import type { Space } from '@charmverse/core/dist/prisma';

import { getGuildRoles } from 'lib/collabland/collablandClient';
import log from 'lib/log';
import { findOrCreateRoles } from 'lib/roles/createRoles';

type Props = {
  space: Space;
  userId: string;
};

export async function upsertSpaceRolesFromDiscord({ space, userId }: Props) {
  if (!space.discordServerId) {
    return;
  }

  try {
    const roles = await getGuildRoles(space.discordServerId);
    await findOrCreateRoles(roles, space.id, userId, {
      source: 'collabland',
      createRoles: true
    });
  } catch (e) {
    log.error('Failed to create space roles from disocrd', e);
  }
}
