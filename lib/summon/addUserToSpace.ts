import { UnauthorisedActionError } from '@charmverse/core/errors';
import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { checkUserSpaceBanStatus } from 'lib/members/checkUserSpaceBanStatus';

type Props = {
  spaceId: string;
  userId: string;
  summonUserId?: string;
};

export async function addUserToSpace({ spaceId, userId, summonUserId }: Props): Promise<Space | null> {
  const space = await prisma.space.findFirstOrThrow({ where: { id: spaceId } });

  const spaceMembership = await prisma.spaceRole.findFirst({
    where: {
      spaceId: space.id,
      userId
    }
  });

  const isUserBannedFromSpace = await checkUserSpaceBanStatus({
    spaceIds: [space.id],
    userId
  });

  if (isUserBannedFromSpace) {
    throw new UnauthorisedActionError(`You have been banned from this space.`);
  }

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
  if (summonUserId) {
    await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        xpsEngineId: summonUserId
      }
    });
  }

  return space;
}
