import { prisma } from '@charmverse/core';
import type { Space } from '@charmverse/core/prisma';

import { verifyDiscordGateForSpace } from 'lib/discord/verifyDiscordGateForSpace';
import { createAndAssignRoles } from 'lib/roles/createAndAssignRoles';
import { InvalidInputError } from 'lib/utilities/errors';

type Props = {
  spaceId: string;
  userId: string;
};

export async function applyDiscordGate({ spaceId, userId }: Props): Promise<Space | null> {
  const space = await prisma.space.findFirst({ where: { id: spaceId } });
  const user = await prisma.user.findFirst({ where: { id: userId }, include: { discordUser: true } });

  if (!space) {
    throw new InvalidInputError('Space not found');
  }

  if (!user) {
    throw new InvalidInputError('User not found');
  }

  const { isVerified, roles } = await verifyDiscordGateForSpace({ space, discordUserId: user?.discordUser?.discordId });

  if (!isVerified) {
    return null;
  }

  const spaceMembership = await prisma.spaceRole.findFirst({
    where: {
      spaceId: space.id,
      userId
    }
  });

  if (!spaceMembership) {
    await prisma.spaceRole.create({
      data: {
        isAdmin: false,
        space: {
          connect: {
            id: space.id
          }
        },
        user: {
          connect: {
            id: userId
          }
        }
      }
    });
  }

  await createAndAssignRoles({ userId, spaceId, roles });

  return space;
}
