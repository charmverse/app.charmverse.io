import { prisma } from 'db';
import { canJoinSpaceViaDiscord } from 'lib/collabland/collablandClient';
import type { CheckDiscordGateResult } from 'lib/discord/interface';
import { InvalidInputError } from 'lib/utilities/errors';

type Props = {
  spaceDomain: string;
  userId: string;
};

export async function checkDiscordGate({ spaceDomain, userId }: Props): Promise<CheckDiscordGateResult> {
  const space = await prisma.space.findFirst({ where: { domain: spaceDomain } });
  const user = await prisma.user.findFirst({ where: { id: userId }, include: { discordUser: true } });

  if (!space) {
    throw new InvalidInputError('Space not found');
  }

  const discordServerId = space.discordServerId;
  const discordUserId = user?.discordUser?.discordId;

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
