import type { PagePermissionLevel, Space } from '@prisma/client';

import { prisma } from 'db';
import { SpaceNotFoundError } from 'lib/public-api';

export async function setSpaceDefaultPagePermission ({
  spaceId, defaultPagePermissionGroup
}:{
  spaceId: string; defaultPagePermissionGroup: PagePermissionLevel;
}): Promise<Space> {
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
    }
  });
}
