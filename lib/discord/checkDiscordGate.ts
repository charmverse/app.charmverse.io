import { prisma } from 'db';
import type { CheckDiscordGateResult } from 'lib/discord/interface';
import { verifyDiscordGateForSpace } from 'lib/discord/verifyDiscordGateForSpace';
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

  const res = await verifyDiscordGateForSpace({ space, discordUserId: user?.discordUser?.discordId });

  return {
    ...res,
    spaceId: space.id
  };
}
