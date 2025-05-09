import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/utils/errors';
import { verifyDiscordGateForSpace } from '@packages/lib/discord/collabland/verifyDiscordGateForSpace';
import type { CheckDiscordGateResult } from '@packages/lib/discord/interface';

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

  const res = await verifyDiscordGateForSpace({ space, discordUserId: user?.discordUser?.discordId });

  return {
    ...res,
    spaceId: space.id
  };
}
