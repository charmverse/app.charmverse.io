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
      isEligible: false,
      hasDiscordServer: !!discordServerId
    };
  }

  const isEligible = canJoinSpaceViaDiscord({ discordServerId, discordUserId });

  return {
    isEligible,
    hasDiscordServer: true
  };
}
