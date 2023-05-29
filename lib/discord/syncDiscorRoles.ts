import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

import { getGuildRoles } from 'lib/collabland/collablandClient';
import type { ExternalRole } from 'lib/roles';
import { findOrCreateRoles } from 'lib/roles/createRoles';

type Props = {
  spaceId: string;
};

const rolePromises: Record<string, Promise<ExternalRole[]> | null> = {};

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
    // reuse existing promise if it exists to avoid spamming collabland
    const existingPromise = rolePromises[spaceId];
    const rolesPromise = existingPromise !== null ? existingPromise : getGuildRoles(space.discordServerId);
    rolePromises[spaceId] = rolesPromise;

    const roles = await rolesPromise;
    rolePromises[spaceId] = null;

    await findOrCreateRoles(roles, space.id, botUser?.userId, {
      source: 'collabland',
      createRoles: true
    });
  } catch (e) {
    log.error('Failed to create space roles from disocrd', e);
  }
}
