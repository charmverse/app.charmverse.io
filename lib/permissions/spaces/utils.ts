import type { Prisma, SpacePermission } from '@charmverse/core/prisma';
import { MissingDataError } from '@root/lib/utils/errors';

export function generateSpacePermissionQuery({
  roleId,
  spaceId,
  userId,
  forSpaceId
}: Pick<SpacePermission, 'forSpaceId'> &
  Partial<
    Pick<SpacePermission, 'userId' | 'roleId' | 'spaceId' | 'forSpaceId'>
  >): Prisma.SpacePermissionWhereUniqueInput {
  if (!roleId && !spaceId && !userId) {
    throw new MissingDataError('Please provide a spaceId, roleId or userId');
  }

  return spaceId
    ? {
        spaceId_forSpaceId: {
          forSpaceId,
          spaceId
        }
      }
    : roleId
      ? {
          roleId_forSpaceId: {
            forSpaceId,
            roleId
          }
        }
      : {
          userId_forSpaceId: {
            forSpaceId,
            userId: userId as string
          }
        };
}
