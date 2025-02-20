import { prisma } from '@charmverse/core/prisma-client';
import { isUUID } from '@packages/utils/strings';
import { InvalidStateError } from '@root/lib/middleware';
import { DataNotFoundError, InvalidInputError } from '@root/lib/utils/errors';

export type RemoveMemberInput = {
  userId: string;
  spaceId: string;
};

export async function removeMember({ spaceId, userId }: RemoveMemberInput): Promise<true> {
  if (!isUUID(spaceId) || !isUUID(userId)) {
    throw new InvalidInputError('spaceId and userId must be valid UUIDs');
  }

  const existingSpaceRole = await prisma.spaceRole.findFirst({
    where: {
      spaceId,
      userId
    }
  });

  if (!existingSpaceRole) {
    throw new DataNotFoundError(`User ${userId} is not a member of space ${spaceId}`);
  }

  if (existingSpaceRole?.isAdmin) {
    const admins = await prisma.spaceRole.count({
      where: {
        spaceId,
        isAdmin: true
      }
    });

    if (admins <= 1) {
      throw new InvalidStateError('There must be at least one admin left in the space');
    }
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
