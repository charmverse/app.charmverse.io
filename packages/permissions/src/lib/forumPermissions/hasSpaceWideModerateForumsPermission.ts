import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/core/errors';
// This method is optimised to perform the least amount of necessary queries with minimal joins
export async function hasSpaceWideModerateForumsPermission({
  userId,
  spaceId
}: {
  userId?: string;
  spaceId: string;
}): Promise<boolean> {
  if (!spaceId) {
    throw new InvalidInputError(`Space id is required`);
  } else if (!userId) {
    return false;
  }

  const userSpaceRole = await prisma.spaceRole.findUnique({
    where: {
      spaceUser: {
        userId,
        spaceId
      }
    },
    select: {
      isAdmin: true,
      spaceRoleToRole: {
        select: {
          roleId: true
        }
      }
    }
  });
  if (!userSpaceRole) {
    return false;
  }

  if (userSpaceRole.isAdmin) {
    return true;
  }

  if (userSpaceRole.spaceRoleToRole.length === 0) {
    return false;
  }

  const permissions = await prisma.spacePermission.findMany({
    where: {
      forSpaceId: spaceId,
      roleId: {
        in: userSpaceRole.spaceRoleToRole.map((spaceRoleRelation) => spaceRoleRelation.roleId)
      }
    },
    select: {
      operations: true
    }
  });

  return permissions.some((p) => p.operations.includes('moderateForums'));
}
