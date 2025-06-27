import { prisma } from '@charmverse/core/prisma-client';

import { InvalidInputError } from '../errors';
import { isUUID } from '../utilities/strings';

import type { PreComputedSpaceRole } from './core/interfaces';

/**
 * @param userId - The ID of the user to check. If empty, the hasAccess should always return an error
 * @disallowGuest - If true, the user must be a member or admin of the space. If false, the user can be a guest
 */
type Input = {
  userId?: string;
  spaceId: string;
} & PreComputedSpaceRole;

interface Result {
  isAdmin?: boolean;
  isReadonlySpace: boolean;
  spaceRole: PreComputedSpaceRole['preComputedSpaceRole'] | null;
}

export async function hasAccessToSpace({ userId, spaceId, preComputedSpaceRole }: Input): Promise<Result> {
  if (!spaceId || !isUUID(spaceId)) {
    throw new InvalidInputError(`Valid space ID is required`);
  } else if (
    preComputedSpaceRole &&
    (preComputedSpaceRole.userId !== userId || preComputedSpaceRole.spaceId !== spaceId)
  ) {
    throw new InvalidInputError(`SpaceRole userId and spaceId do not match the provided userId and spaceId`);
  } else if (!userId) {
    return { spaceRole: null, isReadonlySpace: false };
  }
  const evaluatedSpaceRole =
    preComputedSpaceRole || preComputedSpaceRole === null
      ? preComputedSpaceRole
      : await prisma.spaceRole.findFirst({
          where: {
            spaceId,
            userId
          },
          select: {
            id: true,
            isAdmin: true,
            isGuest: true,
            userId: true,
            spaceId: true,
            space: {
              select: {
                subscriptionTier: true
              }
            }
          }
        });
  if (!evaluatedSpaceRole) {
    return { spaceRole: null, isReadonlySpace: false };
  }
  return {
    isAdmin: evaluatedSpaceRole.isAdmin,
    isReadonlySpace: evaluatedSpaceRole.space.subscriptionTier === 'readonly',
    spaceRole: evaluatedSpaceRole
  };
}
