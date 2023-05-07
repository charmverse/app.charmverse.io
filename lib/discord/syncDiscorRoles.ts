import { prisma } from '@charmverse/core';
import { log } from '@charmverse/core/log';

import { getGuildRoles } from 'lib/collabland/collablandClient';
import { findOrCreateRoles } from 'lib/roles/createRoles';

type Props = {
  spaceId: string;
};

export async function syncDiscordRoles({ spaceId }: Props) {
  const space = await prisma.space.findFirst({ where: { id: spaceId } });
  if (!space?.discordServerId) {
    return;
  }

  const botUser = await prisma.spaceRole.findFirst({
    where: {
      user: {
        isBot: true
      }
    },
    select: {
      userId: true
    }
  });

  if (!botUser?.userId) {
    return;
  }

  try {
    const roles = await getGuildRoles(space.discordServerId);
    await findOrCreateRoles(roles, space.id, botUser?.userId, {
      source: 'collabland',
      createRoles: true
    });
  } catch (e) {
    log.error('Failed to create space roles from disocrd', e);
  }
}
