import { prisma } from 'db';
import { InvalidStateError } from 'lib/middleware';
import { InvalidInputError } from 'lib/utilities/errors';
import { isUUID } from 'lib/utilities/strings';

export type GuestToRemove = {
  userId: string;
  spaceId: string;
};

export async function removeGuest({ spaceId, userId }: GuestToRemove): Promise<true> {
  if (!isUUID(spaceId) || !isUUID(userId)) {
    throw new InvalidInputError('spaceId and userId must be valid UUIDs');
  }

  const existingSpaceRole = await prisma.spaceRole.findFirst({
    where: {
      spaceId,
      userId
    }
  });

  if (!existingSpaceRole?.isGuest) {
    throw new InvalidStateError('User is not a guest of this space');
  }

  const pagePermissionsToDelete = await prisma.pagePermission.findMany({
    where: {
      page: {
        spaceId
      },
      userId
    }
  });

  await prisma.$transaction([
    prisma.spaceRole.delete({
      where: {
        id: existingSpaceRole.id
      }
    }),
    prisma.pagePermission.deleteMany({
      where: {
        id: {
          in: pagePermissionsToDelete.map((pp) => pp.id)
        }
      }
    })
  ]);

  return true;

  // TODO - Remove all individual page permissions
}
