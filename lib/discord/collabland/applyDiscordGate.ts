import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { verifyDiscordGateForSpace } from '@root/lib/discord/collabland/verifyDiscordGateForSpace';
import { checkUserSpaceBanStatus } from '@root/lib/members/checkUserSpaceBanStatus';
import { createAndAssignRoles } from '@root/lib/roles/createAndAssignRoles';
import { InvalidInputError, UnauthorisedActionError } from '@root/lib/utils/errors';

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

  const isUserBannedFromSpace = await checkUserSpaceBanStatus({
    spaceIds: [space.id],
    userId
  });

  if (isUserBannedFromSpace) {
    throw new UnauthorisedActionError(`You have been banned from this space.`);
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
