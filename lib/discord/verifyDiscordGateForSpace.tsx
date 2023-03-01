import type { Space } from '@prisma/client';

import { canJoinSpaceViaDiscord } from 'lib/collabland/collablandClient';

type Props = {
  discordUserId?: string;
  space: Space;
};

export async function verifyDiscordGateForSpace({ discordUserId, space }: Props) {
  const discordServerId = space.discordServerId;

  if (!discordServerId || !discordUserId) {
    return {
      isVerified: false,
      hasDiscordServer: !!discordServerId,
      roles: []
    };
  }

  const { roles, isVerified } = await canJoinSpaceViaDiscord({ discordServerId, discordUserId });

  return {
    isVerified,
    hasDiscordServer: true,
    roles
  };
}
