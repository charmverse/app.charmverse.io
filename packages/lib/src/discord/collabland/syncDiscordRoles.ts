import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getGuildRoles } from '@packages/lib/collabland/collablandClient';
import { findOrCreateRoles } from '@packages/lib/roles/createRoles';

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
    log.error('Failed to create space roles from discord', e);
  }
}
