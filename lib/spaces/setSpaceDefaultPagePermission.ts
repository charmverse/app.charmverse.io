import type { PagePermissionLevel, Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/utils/errors';
import { SpaceNotFoundError } from '@root/lib/public-api';

export async function setSpaceDefaultPagePermission({
  spaceId,
  defaultPagePermissionGroup
}: {
  spaceId: string;
  defaultPagePermissionGroup: PagePermissionLevel;
}): Promise<Space> {
  if (defaultPagePermissionGroup === 'custom') {
    throw new InvalidInputError(`Invalid default page permission group: ${defaultPagePermissionGroup}`);
  }

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
