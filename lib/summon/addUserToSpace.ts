import { prisma } from '@charmverse/core';
import type { Space } from '@prisma/client';

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
