import { log } from '@charmverse/core/log';
import type { Space } from '@charmverse/core/prisma';

import { getGuildRoles } from 'lib/collabland/collablandClient';
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
    const cvRoles = await findOrCreateRoles(roles, space.id, userId, {
      source: 'collabland',
      createRoles: true
    });
    log.info('Retrieved Discord roles from Collab.land', { cvRoles, roles });
  } catch (e) {
    log.error('Failed to create space roles from disocrd', e);
  }
}
