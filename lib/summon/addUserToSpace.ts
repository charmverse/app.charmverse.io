import type { Space } from '@prisma/client';

import { prisma } from 'db';

type Props = {
  spaceId: string;
  userId: string;
};

export async function addUserToSpace({ spaceId, userId }: Props): Promise<Space | null> {
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

  return space;
}
