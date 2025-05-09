import { log } from '@charmverse/core/log';
import { getGuildRoles } from '@packages/lib/collabland/collablandClient';
import { findOrCreateRoles } from '@packages/lib/roles/createRoles';

type Props = {
  spaceId: string;
  discordServerId?: string;
  userId: string;
};

export async function upsertSpaceRolesFromDiscord({ spaceId, discordServerId, userId }: Props) {
  if (!discordServerId) {
    return;
  }

  try {
    const roles = await getGuildRoles(discordServerId);
    const cvRoles = await findOrCreateRoles(roles, spaceId, userId, {
      source: 'collabland',
      createRoles: true
    });
    log.info('Retrieved Discord roles from Collab.Land', { cvRoles, roles, spaceId, userId });
  } catch (e) {
    log.error('Failed to create space roles from discord', { error: e, spaceId, userId });
  }
}
