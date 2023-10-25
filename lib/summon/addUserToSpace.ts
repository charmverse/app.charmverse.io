import { UnauthorisedActionError } from '@charmverse/core/errors';
import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { checkUserSpaceBanStatus } from 'lib/members/checkUserSpaceBanStatus';

type Props = {
  spaceId: string;
  userId: string;
  userXpsEngineId: string;
};

export async function addUserToSpace({ spaceId, userId, userXpsEngineId }: Props): Promise<Space | null> {
  const space = await prisma.space.findFirstOrThrow({ where: { id: spaceId } });

  const spaceMembership = await prisma.spaceRole.findFirst({
    where: {
      spaceId: space.id,
      userId
    }
  });

  const isUserBannedFromSpace = await checkUserSpaceBanStatus({
    spaceId,
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
  await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      xpsEngineId: userXpsEngineId
    }
  });

  return space;
}
