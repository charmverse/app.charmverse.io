import type { Space } from '@charmverse/core/prisma';
import { getDiscordUserState } from '@root/lib/collabland/collablandClient';

type Props = {
  discordUserId?: string;
  space: Space;
};

export async function verifyDiscordGateForSpace({ discordUserId, space }: Props) {
  const discordServerId = space.discordServerId;

  // this is a hack for now, discordServerId is used for both collab.land and import roles from discord feature
  if (!discordServerId || !discordUserId || !space.superApiTokenId) {
    return {
      isVerified: false,
      hasDiscordServer: !!(discordServerId && space.superApiTokenId),
      roles: []
    };
  }

  const { roles, isVerified } = await getDiscordUserState({ discordServerId, discordUserId });

  return {
    isVerified,
    hasDiscordServer: true,
    roles
  };
}
