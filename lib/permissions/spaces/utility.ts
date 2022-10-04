import type { Prisma, SpacePermission } from '@prisma/client';

import { MissingDataError } from 'lib/utilities/errors';

import type { AssignablePermissionGroups } from '../interfaces';

export function generateSpacePermissionQuery ({ roleId, spaceId, userId, forSpaceId }: Pick<SpacePermission, 'forSpaceId'> & Partial<Pick<SpacePermission, 'userId' | 'roleId' | 'spaceId' | 'forSpaceId'>>): Prisma.SpacePermissionWhereUniqueInput {

  if (!roleId && !spaceId && !userId) {
    throw new MissingDataError('Please provide a spaceId, roleId or userId');
  }

  return spaceId ? {
    spaceId_forSpaceId: {
      forSpaceId,
      spaceId
    }
  } : roleId ? {
    roleId_forSpaceId: {
      forSpaceId,
      roleId
    }
  } : {
    userId_forSpaceId: {
      forSpaceId,
      userId: userId as string
    }
  };
}

export function groupIsValid (group: AssignablePermissionGroups): boolean {
  if (group !== 'role' && group !== 'space' && group !== 'user') {
    return false;
  }

  return true;
}
