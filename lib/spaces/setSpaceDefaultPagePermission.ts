import { PagePermissionLevel } from '@prisma/client';
import { prisma } from 'db';
import { SpaceNotFoundError } from 'lib/public-api';

export async function setSpaceDefaultPagePermission (spaceId: string, defaultPagePermissionGroup: PagePermissionLevel) {
  const space = await prisma.space.findUnique({
    where: {
      id: spaceId
    }
  });

  if (!space) {
    throw new SpaceNotFoundError(spaceId);
  }

  return prisma.space.update({
    where: {
      id: spaceId
    },
    data: {
      defaultPagePermissionGroup
    },
    include: {
      permissions: true
    }
  });
}
